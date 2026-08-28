use alert_config_change_ledger::{
    Source, compare, demo_snapshots, load_snapshots, parse_export, render_markdown,
    render_terminal, timeline, timeline_markdown, timeline_terminal,
};
use anyhow::{Context, Result, bail};
use chrono::{DateTime, Utc};
use clap::{Args, Parser, Subcommand, ValueEnum};
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

#[derive(Parser)]
#[command(name = "alert-ledger", version, about = "Compare live alert routes with reviewed config", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Normalize a provider export or read-only API response
    Snapshot(SnapshotArgs),
    /// Compare a reviewed snapshot with a live snapshot
    Diff(DiffArgs),
    /// Show changes across a folder of snapshots
    Timeline(TimelineArgs),
    /// Run the full workflow on bundled sample data
    Demo(DemoArgs),
}

#[derive(Args)]
struct SnapshotArgs {
    /// Input provider: grafana, alertmanager, or normalized
    #[arg(long)]
    provider: String,
    /// Read an export from this file; use '-' for stdin
    #[arg(long, conflicts_with = "url")]
    input: Option<String>,
    /// Fetch an export with one read-only GET request
    #[arg(long, conflicts_with = "input")]
    url: Option<String>,
    /// Environment variable containing a bearer token
    #[arg(long, requires = "url")]
    token_env: Option<String>,
    /// Source label shown in reports, such as git or grafana-live
    #[arg(long)]
    source: String,
    /// Git SHA, export ID, or provider revision
    #[arg(long)]
    revision: Option<String>,
    /// Override the capture time with an RFC 3339 timestamp
    #[arg(long)]
    captured_at: Option<String>,
    /// Snapshot JSON path
    #[arg(long)]
    output: PathBuf,
}

#[derive(Args)]
struct DiffArgs {
    /// Reviewed ledger snapshot
    #[arg(long)]
    baseline: PathBuf,
    /// Live ledger snapshot
    #[arg(long)]
    live: PathBuf,
    /// Report format
    #[arg(long, value_enum, default_value = "terminal")]
    format: Format,
    /// Write the report to a file instead of stdout
    #[arg(long)]
    output: Option<PathBuf>,
}

#[derive(Args)]
struct TimelineArgs {
    /// Folder containing ledger snapshot JSON files
    #[arg(long)]
    dir: PathBuf,
    /// Report format
    #[arg(long, value_enum, default_value = "terminal")]
    format: Format,
    /// Write the report to a file instead of stdout
    #[arg(long)]
    output: Option<PathBuf>,
}

#[derive(Args)]
struct DemoArgs {
    /// Print machine-readable JSON
    #[arg(long)]
    json: bool,
}

#[derive(Clone, Copy, ValueEnum)]
enum Format {
    Terminal,
    Json,
    Markdown,
}

fn main() -> ExitCode {
    match run() {
        Ok(code) => ExitCode::from(code),
        Err(error) => {
            eprintln!("error: {error:#}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<u8> {
    match Cli::parse().command {
        Command::Snapshot(args) => {
            let bytes = read_snapshot_input(&args)?;
            let captured_at = args
                .captured_at
                .as_deref()
                .map(str::parse::<DateTime<Utc>>)
                .transpose()
                .context("--captured-at must be an RFC 3339 timestamp")?
                .unwrap_or_else(Utc::now);
            let snapshot = parse_export(
                &bytes,
                &args.provider.to_lowercase(),
                Source {
                    name: args.source,
                    revision: args.revision,
                },
                captured_at,
            )?;
            write_file(&args.output, &serde_json::to_string_pretty(&snapshot)?)?;
            println!(
                "Wrote {} routes to {}",
                snapshot.routes.len(),
                args.output.display()
            );
            Ok(0)
        }
        Command::Diff(args) => {
            let baseline = read_snapshot(&args.baseline)?;
            let live = read_snapshot(&args.live)?;
            let report = compare(&baseline, &live);
            let output = match args.format {
                Format::Terminal => render_terminal(&report),
                Format::Json => format!("{}\n", serde_json::to_string_pretty(&report)?),
                Format::Markdown => render_markdown(&report),
            };
            emit(output, args.output.as_deref())?;
            Ok(if report.changes.is_empty() { 0 } else { 2 })
        }
        Command::Timeline(args) => {
            let entries = timeline(load_snapshots(&args.dir)?);
            let has_changes = !entries.is_empty();
            let output = match args.format {
                Format::Terminal => timeline_terminal(&entries),
                Format::Json => format!("{}\n", serde_json::to_string_pretty(&entries)?),
                Format::Markdown => timeline_markdown(&entries),
            };
            emit(output, args.output.as_deref())?;
            Ok(if has_changes { 2 } else { 0 })
        }
        Command::Demo(args) => run_demo(args.json),
    }
}

fn read_snapshot_input(args: &SnapshotArgs) -> Result<Vec<u8>> {
    if let Some(input) = &args.input {
        if input == "-" {
            return std::io::read_to_string(std::io::stdin())
                .map(String::into_bytes)
                .context("cannot read stdin");
        }
        return fs::read(input).with_context(|| format!("cannot read input file {input}"));
    }
    let Some(url) = &args.url else {
        bail!("provide either --input <file> or --url <https-url>")
    };
    if !url.starts_with("https://")
        && !url.starts_with("http://localhost")
        && !url.starts_with("http://127.0.0.1")
    {
        bail!("--url must use HTTPS; plain HTTP is allowed only for localhost");
    }
    let client = reqwest::blocking::Client::builder()
        .user_agent("alert-config-ledger/0.1.0")
        .build()?;
    let mut request = client.get(url);
    if let Some(variable) = &args.token_env {
        let token = std::env::var(variable)
            .with_context(|| format!("environment variable {variable} is not set"))?;
        request = request.bearer_auth(token);
    }
    let response = request.send().with_context(|| {
        format!("could not read {url}; check the URL, network, and read-only token")
    })?;
    let status = response.status();
    if !status.is_success() {
        bail!("provider returned HTTP {status}; check the URL and read-only token");
    }
    Ok(response.bytes()?.to_vec())
}

fn read_snapshot(path: &Path) -> Result<alert_config_change_ledger::Snapshot> {
    let bytes =
        fs::read(path).with_context(|| format!("cannot read snapshot {}", path.display()))?;
    let snapshot = serde_json::from_slice(&bytes)
        .with_context(|| format!("{} is not a valid ledger snapshot", path.display()))?;
    Ok(snapshot)
}

fn write_file(path: &Path, contents: &str) -> Result<()> {
    if let Some(parent) = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
    {
        fs::create_dir_all(parent)
            .with_context(|| format!("cannot create {}", parent.display()))?;
    }
    fs::write(path, contents).with_context(|| format!("cannot write {}", path.display()))
}

fn emit(contents: String, output: Option<&Path>) -> Result<()> {
    if let Some(path) = output {
        write_file(path, &contents)
    } else {
        print!("{contents}");
        Ok(())
    }
}

fn run_demo(json_output: bool) -> Result<u8> {
    let (baseline, live) = demo_snapshots()?;
    let stamp = Utc::now().format("%Y%m%d-%H%M%S");
    let dir =
        std::env::temp_dir().join(format!("alert-ledger-demo-{stamp}-{}", std::process::id()));
    fs::create_dir_all(&dir)
        .with_context(|| format!("cannot create demo folder {}", dir.display()))?;
    let baseline_path = dir.join("01-reviewed.json");
    let live_path = dir.join("02-live.json");
    let report_path = dir.join("drift.md");
    write_file(&baseline_path, &serde_json::to_string_pretty(&baseline)?)?;
    write_file(&live_path, &serde_json::to_string_pretty(&live)?)?;
    let report = compare(&baseline, &live);
    write_file(&report_path, &render_markdown(&report))?;
    if json_output {
        println!(
            "{}",
            serde_json::to_string_pretty(
                &json!({"demo": true, "output_dir": dir, "report": report})
            )?
        );
    } else {
        println!("DEMO — sample data, nothing is saved outside this temporary folder\n");
        print!("{}", render_terminal(&report));
        println!("\nDemo files: {}", dir.display());
    }
    Ok(0)
}
