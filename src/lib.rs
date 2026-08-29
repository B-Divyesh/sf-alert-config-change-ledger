use anyhow::{Context, Result, bail};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

pub const SCHEMA_VERSION: u8 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Source {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revision: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Snapshot {
    pub schema_version: u8,
    pub provider: String,
    pub captured_at: DateTime<Utc>,
    pub source: Source,
    pub routes: Vec<Route>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Route {
    pub id: String,
    pub name: String,
    pub path: String,
    pub matchers: BTreeMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub severity: Option<String>,
    pub recipients: Vec<Recipient>,
    pub semantics: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Recipient {
    pub name: String,
    pub channels: Vec<String>,
    pub fingerprints: Vec<String>,
    #[serde(default = "empty_object", skip_serializing_if = "is_empty_object")]
    pub provider_fields: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DriftReport {
    pub baseline: SnapshotRef,
    pub live: SnapshotRef,
    pub matched_routes: usize,
    pub changes: Vec<Change>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SnapshotRef {
    pub source: String,
    pub revision: Option<String>,
    pub captured_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Change {
    pub kind: ChangeKind,
    pub route: String,
    pub route_id: String,
    pub fields: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub before: Option<RouteView>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub after: Option<RouteView>,
    pub attributed_to: SnapshotRef,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ChangeKind {
    Added,
    Removed,
    Modified,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RouteView {
    pub severity: Option<String>,
    pub recipients: Vec<String>,
    pub matchers: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TimelineEntry {
    pub at: DateTime<Utc>,
    pub source: SnapshotRef,
    pub compared_with: SnapshotRef,
    pub changes: Vec<Change>,
}

pub fn parse_export(
    bytes: &[u8],
    provider: &str,
    source: Source,
    captured_at: DateTime<Utc>,
) -> Result<Snapshot> {
    if provider == "normalized" {
        let snapshot: Snapshot = serde_json::from_slice(bytes)
            .context("normalized input must be an Alert Config Ledger snapshot in JSON")?;
        if snapshot.schema_version != SCHEMA_VERSION {
            bail!(
                "snapshot schema version {} is not supported",
                snapshot.schema_version
            );
        }
        return Ok(snapshot);
    }

    let value: Value = if provider == "alertmanager" {
        let yaml: serde_yaml::Value = serde_yaml::from_slice(bytes)
            .context("Alertmanager input is not valid YAML or JSON")?;
        serde_json::to_value(yaml).context("Alertmanager input contains unsupported map keys")?
    } else if provider == "grafana" {
        serde_json::from_slice(bytes).context("Grafana input is not valid JSON")?
    } else {
        bail!("unsupported provider '{provider}'; use grafana, alertmanager, or normalized");
    };

    let contacts = collect_contacts(&value, provider);
    let is_grafana_contact_export = provider == "grafana"
        && (value.is_array()
            || (value
                .get("contactPoints")
                .and_then(Value::as_array)
                .is_some()
                && value.get("policy").is_none()
                && value.get("receiver").is_none()));
    if is_grafana_contact_export {
        return snapshot_from_contact_points(contacts, source, captured_at);
    }
    let route_root = if provider == "alertmanager" {
        value.get("route").unwrap_or(&value)
    } else {
        value.get("policy").unwrap_or(&value)
    };
    if !route_root.is_object() {
        bail!("{provider} export has no route object");
    }

    let mut routes = Vec::new();
    flatten_routes(route_root, "root", 0, &contacts, &mut routes)?;
    if routes.is_empty() {
        bail!("{provider} export contains no alert routes");
    }
    disambiguate_route_ids(&mut routes);
    routes.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(Snapshot {
        schema_version: SCHEMA_VERSION,
        provider: provider.to_string(),
        captured_at,
        source,
        routes,
    })
}

fn disambiguate_route_ids(routes: &mut [Route]) {
    let mut counts = BTreeMap::new();
    for route in routes.iter() {
        *counts.entry(route.id.clone()).or_insert(0_usize) += 1;
    }
    for route in routes {
        if counts.get(&route.id).copied().unwrap_or_default() > 1 {
            let identity = format!("{}@{}", route.id, route.path);
            route.id = format!("route-{}", &fingerprint(&identity)[..12]);
        }
    }
}

fn collect_contacts(value: &Value, provider: &str) -> BTreeMap<String, Recipient> {
    let key = if provider == "alertmanager" {
        "receivers"
    } else {
        "contactPoints"
    };
    let mut result = BTreeMap::new();
    let items = if provider == "grafana" && value.is_array() {
        value.as_array()
    } else {
        value.get(key).and_then(Value::as_array)
    };
    let Some(items) = items else {
        return result;
    };
    for item in items {
        let Some(name) = item.get("name").and_then(Value::as_str) else {
            continue;
        };
        let mut channels = BTreeSet::new();
        let mut secrets = Vec::new();
        let receiver_values = item
            .get("receivers")
            .and_then(Value::as_array)
            .map(Vec::as_slice)
            .unwrap_or_else(|| std::slice::from_ref(item));
        for receiver in receiver_values {
            if let Some(kind) = receiver.get("type").and_then(Value::as_str) {
                channels.insert(kind.to_string());
            }
            if let Some(object) = receiver.as_object() {
                for (key, nested) in object {
                    if key.ends_with("_configs") {
                        channels.insert(key.trim_end_matches("_configs").to_string());
                    }
                    collect_contact_values(key, nested, &mut secrets);
                }
            }
        }
        secrets.sort();
        secrets.dedup();
        let fingerprints = secrets.iter().map(|secret| fingerprint(secret)).collect();
        result.insert(
            name.to_string(),
            Recipient {
                name: name.to_string(),
                channels: channels.into_iter().collect(),
                fingerprints,
                provider_fields: redact_contact_fields(item),
            },
        );
    }
    result
}

fn collect_contact_values(key: &str, value: &Value, output: &mut Vec<String>) {
    if is_sensitive_contact_key(key) {
        match value {
            Value::String(text) => output.push(text.to_string()),
            Value::Array(items) => items
                .iter()
                .filter_map(Value::as_str)
                .for_each(|text| output.push(text.to_string())),
            _ => {}
        }
        return;
    }
    match value {
        Value::Object(map) => map
            .iter()
            .for_each(|(key, value)| collect_contact_values(key, value, output)),
        Value::Array(items) => items
            .iter()
            .for_each(|value| collect_contact_values(key, value, output)),
        _ => {}
    }
}

fn is_sensitive_contact_key(key: &str) -> bool {
    const SENSITIVE_KEYS: &[&str] = &[
        "address",
        "addresses",
        "apikey",
        "apiurl",
        "authorization",
        "authorizationcredentials",
        "bottoken",
        "email",
        "emails",
        "endpoint",
        "integrationkey",
        "password",
        "phone",
        "phonenumber",
        "recipient",
        "recipients",
        "routingkey",
        "to",
        "token",
        "url",
        "webhookurl",
    ];
    let normalized_key = key
        .chars()
        .filter(|character| character.is_ascii_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect::<String>();
    SENSITIVE_KEYS.contains(&normalized_key.as_str())
}

fn redact_contact_fields(value: &Value) -> Value {
    match value {
        Value::Object(map) => Value::Object(
            map.iter()
                .filter(|(key, _)| !is_sensitive_contact_key(key))
                .map(|(key, nested)| (key.clone(), redact_contact_fields(nested)))
                .collect(),
        ),
        Value::Array(items) => Value::Array(items.iter().map(redact_contact_fields).collect()),
        _ => value.clone(),
    }
}

fn snapshot_from_contact_points(
    contacts: BTreeMap<String, Recipient>,
    source: Source,
    captured_at: DateTime<Utc>,
) -> Result<Snapshot> {
    if contacts.is_empty() {
        bail!("grafana contact point export contains no named contact points");
    }
    let routes = contacts
        .into_values()
        .map(|recipient| {
            let name = recipient.name.clone();
            let provider_updated_at =
                ["updated_at", "updatedAt", "updated"]
                    .iter()
                    .find_map(|key| {
                        recipient
                            .provider_fields
                            .get(*key)
                            .and_then(Value::as_str)
                            .map(str::to_string)
                    });
            Route {
                id: format!("contact-{}", &fingerprint(&name)[..12]),
                name: format!("contact point {name}"),
                path: format!("contact-points/{name}"),
                matchers: BTreeMap::new(),
                severity: None,
                recipients: vec![recipient],
                semantics: json!({"object": "grafana contact point"}),
                provider_updated_at,
            }
        })
        .collect();
    Ok(Snapshot {
        schema_version: SCHEMA_VERSION,
        provider: "grafana".to_string(),
        captured_at,
        source,
        routes,
    })
}

fn empty_object() -> Value {
    json!({})
}

fn is_empty_object(value: &Value) -> bool {
    value.as_object().is_some_and(Map::is_empty)
}

fn flatten_routes(
    value: &Value,
    path: &str,
    depth: usize,
    contacts: &BTreeMap<String, Recipient>,
    output: &mut Vec<Route>,
) -> Result<()> {
    let object = value
        .as_object()
        .context("a route entry is not an object")?;
    let matchers = parse_matchers(object);
    let severity = matchers.get("severity").map(|value| {
        value
            .trim_start_matches("!~")
            .trim_start_matches("=~")
            .trim_start_matches("!=")
            .trim_start_matches('=')
            .to_string()
    });
    let scope: BTreeMap<_, _> = matchers
        .iter()
        .filter(|(key, _)| key.as_str() != "severity")
        .map(|(key, value)| (key.clone(), value.clone()))
        .collect();
    let receiver = object
        .get("receiver")
        .and_then(Value::as_str)
        .unwrap_or("unassigned");
    let identity = if depth == 0 {
        "root".to_string()
    } else if scope.is_empty() {
        path.to_string()
    } else {
        scope
            .iter()
            .map(|(key, value)| format!("{key}{value}"))
            .collect::<Vec<_>>()
            .join("&")
    };
    let name = if depth == 0 {
        "default route".to_string()
    } else if scope.is_empty() {
        receiver.to_string()
    } else {
        scope
            .iter()
            .map(|(key, value)| format_matcher(key, value))
            .collect::<Vec<_>>()
            .join(", ")
    };
    let mut semantics = Map::new();
    for (key, item) in object {
        if !matches!(
            key.as_str(),
            "routes"
                | "receiver"
                | "matchers"
                | "match"
                | "match_re"
                | "object_matchers"
                | "updated"
                | "updated_at"
                | "updatedAt"
                | "contactPoints"
                | "receivers"
        ) {
            semantics.insert(key.clone(), item.clone());
        }
    }
    let provider_updated_at = ["updated_at", "updatedAt", "updated"]
        .iter()
        .find_map(|key| object.get(*key).and_then(Value::as_str).map(str::to_string));
    let recipient = contacts
        .get(receiver)
        .cloned()
        .unwrap_or_else(|| Recipient {
            name: receiver.to_string(),
            channels: Vec::new(),
            fingerprints: Vec::new(),
            provider_fields: empty_object(),
        });
    output.push(Route {
        id: format!("route-{}", &fingerprint(&identity)[..12]),
        name,
        path: path.to_string(),
        matchers,
        severity,
        recipients: vec![recipient],
        semantics: Value::Object(semantics),
        provider_updated_at,
    });
    if let Some(children) = object.get("routes").and_then(Value::as_array) {
        for (index, child) in children.iter().enumerate() {
            flatten_routes(
                child,
                &format!("{path}/{index}"),
                depth + 1,
                contacts,
                output,
            )?;
        }
    }
    Ok(())
}

fn format_matcher(key: &str, value: &str) -> String {
    for operator in ["!~", "=~", "!=", "="] {
        if let Some(operand) = value.strip_prefix(operator) {
            return format!("{key} {operator} {operand}");
        }
    }
    format!("{key} {value}")
}

fn parse_matchers(object: &Map<String, Value>) -> BTreeMap<String, String> {
    let mut matchers = BTreeMap::new();
    if let Some(items) = object.get("object_matchers").and_then(Value::as_array) {
        for item in items {
            if let Some(parts) = item.as_array()
                && parts.len() >= 3
                && let (Some(key), Some(op), Some(value)) =
                    (parts[0].as_str(), parts[1].as_str(), parts[2].as_str())
            {
                matchers.insert(key.to_string(), format!("{op}{value}"));
            }
        }
    }
    if let Some(items) = object.get("matchers").and_then(Value::as_array) {
        for item in items.iter().filter_map(Value::as_str) {
            for operator in ["!~", "=~", "!=", "="] {
                if let Some((key, value)) = item.split_once(operator) {
                    matchers.insert(
                        key.trim().to_string(),
                        format!("{operator}{}", value.trim().trim_matches('"')),
                    );
                    break;
                }
            }
        }
    }
    for (field, operator) in [("match", "="), ("match_re", "=~")] {
        if let Some(map) = object.get(field).and_then(Value::as_object) {
            for (key, value) in map {
                if let Some(text) = value.as_str() {
                    matchers.insert(key.clone(), format!("{operator}{text}"));
                }
            }
        }
    }
    matchers
}

pub fn compare(baseline: &Snapshot, live: &Snapshot) -> DriftReport {
    let baseline_ref = snapshot_ref(baseline);
    let live_ref = snapshot_ref(live);
    let before = index_routes(&baseline.routes);
    let after = index_routes(&live.routes);
    let ids: BTreeSet<_> = before.keys().chain(after.keys()).cloned().collect();
    let mut matched_routes = 0;
    let mut changes = Vec::new();
    for id in ids {
        match (before.get(&id), after.get(&id)) {
            (None, Some(route)) => changes.push(Change {
                kind: ChangeKind::Added,
                route: route.name.clone(),
                route_id: id.clone(),
                fields: vec!["route".to_string()],
                before: None,
                after: Some(route_view(route)),
                attributed_to: live_ref.clone(),
            }),
            (Some(route), None) => changes.push(Change {
                kind: ChangeKind::Removed,
                route: route.name.clone(),
                route_id: id.clone(),
                fields: vec!["route".to_string()],
                before: Some(route_view(route)),
                after: None,
                attributed_to: live_ref.clone(),
            }),
            (Some(old), Some(new)) => {
                let mut fields = Vec::new();
                if old.severity != new.severity {
                    fields.push("severity".to_string());
                }
                if old.recipients != new.recipients {
                    fields.push("recipients".to_string());
                }
                if old.matchers != new.matchers {
                    fields.push("matchers".to_string());
                }
                if old.semantics != new.semantics {
                    fields.push("provider semantics".to_string());
                }
                if fields.is_empty() {
                    matched_routes += 1;
                } else {
                    changes.push(Change {
                        kind: ChangeKind::Modified,
                        route: new.name.clone(),
                        route_id: id.clone(),
                        fields,
                        before: Some(route_view(old)),
                        after: Some(route_view(new)),
                        attributed_to: live_ref.clone(),
                    });
                }
            }
            (None, None) => unreachable!(),
        }
    }
    DriftReport {
        baseline: baseline_ref,
        live: live_ref,
        matched_routes,
        changes,
    }
}

fn index_routes(routes: &[Route]) -> BTreeMap<String, &Route> {
    let mut id_counts = BTreeMap::new();
    for route in routes {
        *id_counts.entry(&route.id).or_insert(0_usize) += 1;
    }

    let mut key_counts = BTreeMap::new();
    let mut indexed = BTreeMap::new();
    for route in routes {
        let base = if id_counts.get(&route.id).copied().unwrap_or_default() > 1 {
            format!("{}@{}", route.id, route.path)
        } else {
            route.id.clone()
        };
        let occurrence = key_counts.entry(base.clone()).or_insert(0_usize);
        let key = if *occurrence == 0 {
            base
        } else {
            format!("{base}#{}", *occurrence + 1)
        };
        *occurrence += 1;
        indexed.insert(key, route);
    }
    indexed
}

fn route_view(route: &Route) -> RouteView {
    RouteView {
        severity: route.severity.clone(),
        recipients: route.recipients.iter().map(display_recipient).collect(),
        matchers: route.matchers.clone(),
    }
}

fn display_recipient(recipient: &Recipient) -> String {
    let channels = if recipient.channels.is_empty() {
        "channel unknown".to_string()
    } else {
        recipient.channels.join("+")
    };
    let fingerprints = if recipient.fingerprints.is_empty() {
        "no endpoint in export".to_string()
    } else {
        recipient
            .fingerprints
            .iter()
            .map(|item| format!("fp:{}", &item[..12]))
            .collect::<Vec<_>>()
            .join(",")
    };
    format!("{} [{channels}; {fingerprints}]", recipient.name)
}

fn snapshot_ref(snapshot: &Snapshot) -> SnapshotRef {
    SnapshotRef {
        source: snapshot.source.name.clone(),
        revision: snapshot.source.revision.clone(),
        captured_at: snapshot.captured_at,
    }
}

pub fn render_terminal(report: &DriftReport) -> String {
    let mut out = String::new();
    out.push_str("ALERT CONFIG LEDGER\n");
    out.push_str(&format!(
        "BASE  {}{} · {}\n",
        report.baseline.source,
        revision_label(&report.baseline.revision),
        report.baseline.captured_at.to_rfc3339()
    ));
    out.push_str(&format!(
        "LIVE  {}{} · {}\n",
        report.live.source,
        revision_label(&report.live.revision),
        report.live.captured_at.to_rfc3339()
    ));
    if report.changes.is_empty() {
        out.push_str(&format!(
            "\n✓ MATCHED  {} routes match the reviewed baseline.\n",
            report.matched_routes
        ));
        return out;
    }
    out.push_str(&format!(
        "\n! CHANGE  {} changed routes · {} matched\n",
        report.changes.len(),
        report.matched_routes
    ));
    for change in &report.changes {
        out.push_str(&format!(
            "\n{} {}\n",
            change_symbol(&change.kind),
            change.route
        ));
        out.push_str(&format!("  changed: {}\n", change.fields.join(", ")));
        if let Some(before) = &change.before {
            out.push_str(&format!("  before: {}\n", compact_view(before)));
        }
        if let Some(after) = &change.after {
            out.push_str(&format!("  after:  {}\n", compact_view(after)));
        }
        out.push_str(&format!(
            "  source: {}{} @ {}\n",
            change.attributed_to.source,
            revision_label(&change.attributed_to.revision),
            change.attributed_to.captured_at.to_rfc3339()
        ));
    }
    out
}

pub fn render_markdown(report: &DriftReport) -> String {
    let mut out = format!(
        "# Alert configuration changes\n\nBaseline: `{}`{}  \nLive: `{}`{}\n\n",
        report.baseline.source,
        revision_label(&report.baseline.revision),
        report.live.source,
        revision_label(&report.live.revision)
    );
    if report.changes.is_empty() {
        out.push_str(&format!(
            "**Matched:** {} routes match the reviewed baseline.\n",
            report.matched_routes
        ));
        return out;
    }
    out.push_str(&format!(
        "**Changes:** {} changed routes; {} matched.\n\n",
        report.changes.len(),
        report.matched_routes
    ));
    out.push_str("| Change | Route | Fields | Source |\n| --- | --- | --- | --- |\n");
    for change in &report.changes {
        out.push_str(&format!(
            "| {:?} | {} | {} | {}{} |\n",
            change.kind,
            escape_cell(&change.route),
            change.fields.join(", "),
            escape_cell(&change.attributed_to.source),
            revision_label(&change.attributed_to.revision)
        ));
    }
    out.push_str(
        "\nRecipient endpoints are redacted. `fp:` values are one-way SHA-256 fingerprints.\n",
    );
    out
}

pub fn timeline(mut snapshots: Vec<Snapshot>) -> Vec<TimelineEntry> {
    snapshots.sort_by_key(|snapshot| snapshot.captured_at);
    snapshots
        .windows(2)
        .filter_map(|pair| {
            let report = compare(&pair[0], &pair[1]);
            if report.changes.is_empty() {
                return None;
            }
            Some(TimelineEntry {
                at: pair[1].captured_at,
                source: report.live,
                compared_with: report.baseline,
                changes: report.changes,
            })
        })
        .collect()
}

pub fn load_snapshots(dir: &Path) -> Result<Vec<Snapshot>> {
    let mut paths: Vec<PathBuf> = fs::read_dir(dir)
        .with_context(|| format!("cannot read snapshot folder {}", dir.display()))?
        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
        .filter(|path| path.extension().and_then(|ext| ext.to_str()) == Some("json"))
        .collect();
    paths.sort();
    if paths.is_empty() {
        bail!(
            "snapshot folder {} contains no .json files; run 'alert-ledger snapshot' first",
            dir.display()
        );
    }
    paths
        .into_iter()
        .map(|path| {
            let bytes =
                fs::read(&path).with_context(|| format!("cannot read {}", path.display()))?;
            serde_json::from_slice(&bytes)
                .with_context(|| format!("{} is not a valid ledger snapshot", path.display()))
        })
        .collect()
}

pub fn fingerprint(value: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn revision_label(revision: &Option<String>) -> String {
    revision
        .as_ref()
        .map(|value| format!("#{value}"))
        .unwrap_or_default()
}

fn change_symbol(kind: &ChangeKind) -> &'static str {
    match kind {
        ChangeKind::Added => "+",
        ChangeKind::Removed => "−",
        ChangeKind::Modified => "~",
    }
}

fn compact_view(view: &RouteView) -> String {
    format!(
        "severity {}; {}",
        view.severity.as_deref().unwrap_or("unset"),
        view.recipients.join(", ")
    )
}

fn escape_cell(value: &str) -> String {
    value.replace('|', "\\|")
}

pub fn timeline_terminal(entries: &[TimelineEntry]) -> String {
    if entries.is_empty() {
        return "No changes found between the snapshots.\n".to_string();
    }
    let mut out = format!("ALERT CONFIG TIMELINE · {} change sets\n", entries.len());
    for entry in entries {
        out.push_str(&format!(
            "\n{} · {}{}\n",
            entry.at.to_rfc3339(),
            entry.source.source,
            revision_label(&entry.source.revision)
        ));
        for change in &entry.changes {
            out.push_str(&format!(
                "  {} {} · {}\n",
                change_symbol(&change.kind),
                change.route,
                change.fields.join(", ")
            ));
        }
    }
    out
}

pub fn timeline_markdown(entries: &[TimelineEntry]) -> String {
    if entries.is_empty() {
        return "# Alert configuration timeline\n\nNo changes found between the snapshots.\n"
            .to_string();
    }
    let mut out = "# Alert configuration timeline\n".to_string();
    for entry in entries {
        out.push_str(&format!(
            "\n## {} — {}{}\n\n",
            entry.at.to_rfc3339(),
            entry.source.source,
            revision_label(&entry.source.revision)
        ));
        for change in &entry.changes {
            out.push_str(&format!(
                "- **{:?}:** {} — {}\n",
                change.kind,
                change.route,
                change.fields.join(", ")
            ));
        }
    }
    out
}

pub fn demo_snapshots() -> Result<(Snapshot, Snapshot)> {
    let reviewed = parse_export(
        include_bytes!("../examples/grafana-reviewed.json"),
        "grafana",
        Source {
            name: "git:platform/alerts".into(),
            revision: Some("a81c7e2".into()),
        },
        "2026-08-27T16:00:00Z".parse().unwrap(),
    )?;
    let live = parse_export(
        include_bytes!("../examples/grafana-live.json"),
        "grafana",
        Source {
            name: "grafana:production".into(),
            revision: Some("live-1842".into()),
        },
        "2026-08-28T07:42:00Z".parse().unwrap(),
    )?;
    Ok((reviewed, live))
}

pub fn report_as_json(report: &DriftReport) -> Value {
    json!(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn demo_finds_route_recipient_and_severity_drift() {
        let (baseline, live) = demo_snapshots().unwrap();
        let report = compare(&baseline, &live);
        assert_eq!(report.changes.len(), 3);
        assert!(
            report
                .changes
                .iter()
                .any(|change| change.fields.contains(&"recipients".to_string()))
        );
        assert!(
            report
                .changes
                .iter()
                .any(|change| change.fields.contains(&"severity".to_string()))
        );
        assert!(
            report
                .changes
                .iter()
                .any(|change| change.kind == ChangeKind::Added)
        );
    }

    #[test]
    fn snapshot_never_contains_contact_values() {
        let (baseline, _) = demo_snapshots().unwrap();
        let output = serde_json::to_string(&baseline).unwrap();
        assert!(!output.contains("ops@example.test"));
        assert!(!output.contains("https://"));
        assert!(output.contains("fingerprints"));
    }

    #[test]
    fn alertmanager_yaml_is_normalized() {
        let snapshot = parse_export(
            include_bytes!("../examples/alertmanager.yml"),
            "alertmanager",
            Source {
                name: "test".into(),
                revision: None,
            },
            Utc::now(),
        )
        .unwrap();
        assert_eq!(snapshot.routes.len(), 2);
        assert!(
            snapshot
                .routes
                .iter()
                .any(|route| route.severity.as_deref() == Some("critical"))
        );
    }

    #[test]
    fn grafana_contact_point_arrays_detect_common_recipient_changes() {
        let baseline = parse_export(
            include_bytes!("../examples/grafana-contact-points-reviewed.json"),
            "grafana",
            Source {
                name: "reviewed".into(),
                revision: None,
            },
            "2026-08-27T09:00:00Z".parse().unwrap(),
        )
        .unwrap();
        let live = parse_export(
            include_bytes!("../examples/grafana-contact-points-live.json"),
            "grafana",
            Source {
                name: "live".into(),
                revision: None,
            },
            "2026-08-28T10:15:00Z".parse().unwrap(),
        )
        .unwrap();

        assert_eq!(baseline.routes.len(), 5);
        assert_eq!(compare(&baseline, &live).changes.len(), 5);
        assert_eq!(
            baseline
                .routes
                .iter()
                .flat_map(|route| &route.recipients)
                .flat_map(|recipient| &recipient.channels)
                .cloned()
                .collect::<BTreeSet<_>>(),
            ["email", "opsgenie", "pagerduty", "slack", "webhook"]
                .map(str::to_string)
                .into_iter()
                .collect()
        );
    }

    #[test]
    fn grafana_contact_metadata_is_preserved_without_credentials() {
        let snapshot = parse_export(
            include_bytes!("../examples/grafana-contact-points-reviewed.json"),
            "grafana",
            Source {
                name: "reviewed".into(),
                revision: None,
            },
            Utc::now(),
        )
        .unwrap();
        let pager = snapshot
            .routes
            .iter()
            .find(|route| route.name == "contact point primary-pager")
            .unwrap();
        let serialized = serde_json::to_string(&snapshot).unwrap();

        assert_eq!(
            pager.provider_updated_at.as_deref(),
            Some("2026-08-27T09:00:00Z")
        );
        assert_eq!(pager.recipients[0].provider_fields["provenance"], "file");
        assert_eq!(
            pager.recipients[0].provider_fields["receivers"][0]["uid"],
            "pager-01"
        );
        assert!(serialized.contains("pagerduty"));
        assert!(!serialized.contains("pd-reviewed-key"));
    }
}
