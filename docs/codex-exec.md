# Non-Interactive Codex Worker

This project can run CI failure triage through `codex exec`, which starts Codex as a non-interactive worker instead of an interactive terminal session.

The worker reads the triage prompt in `.github/codex/prompts/triage.md`, uses the JSON schema in `.github/codex/schemas/triage.schema.json`, and writes the final report to `triage/reports/latest.json`.

## Commands

Collect the current failure log:

```sh
npm run triage:collect
```

Run the non-interactive Codex triage worker:

```sh
npm run triage:exec
```

Validate the generated JSON report:

```sh
npm run triage:validate
```

Record the human approval boundary:

```sh
npm run triage:approval
```

## How It Differs From Interactive Codex

Interactive Codex is useful for exploratory development and back-and-forth debugging. `codex exec` is better for CI-style automation because it accepts a fixed task, runs non-interactively, and can write the final response to a known file.

In this repo, `codex exec` is configured as a read-only triage worker. It should diagnose the CI failure and produce structured JSON. It should not apply patches.

## Why Read-Only First

The first automation step is diagnosis. Keeping triage read-only makes the output auditable and prevents the worker from changing application code while it is still classifying the failure.

Patch application is separated behind human approval so a person can review the root cause, risk level, affected files, and verification plan before any source file is modified.

## Future CI Mapping

A later CI workflow can follow this path:

1. collect the failing test log
2. run Codex Action or `codex exec` with an API key available to the runner
3. validate `triage/reports/latest.json`
4. upload the report as an artifact
5. require human approval before any patch is applied
