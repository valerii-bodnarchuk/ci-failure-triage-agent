# CI Failure Triage Agent

This is a small TypeScript demo project for a controlled Codex workflow that triages CI failures without immediately changing code.

## Demo Flow

1. Start from a clean clone and install with `npm ci`.
2. Run `npm test` and show the intentional failing reconciliation test.
3. Capture the failure log with `npm run triage:collect`.
4. Run Codex as a read-only triage worker with `npm run triage:exec`.
5. Validate the structured JSON report against `.github/codex/schemas/triage.schema.json`.
6. Record the human approval boundary before any patch work.
7. Apply a minimal approved patch, then run tests and typecheck.

## Safety Boundary

- Diagnosis happens before modification.
- The triage prompt is read-only.
- No secrets, `.env` files, tokens, keys, credentials, or local machine config should be read or printed.
- No git push.
- No broad rewrites.
- No new dependencies without approval.

## Commands

```sh
npm ci
npm test
npm run typecheck
npm run triage:collect
npm run triage:exec
npm run triage:validate
npm run triage:approval -- --approved-by valerii
```

## Non-interactive Codex worker

Requires the Codex CLI to be installed and authenticated.

```sh
npm run triage:collect
npm run triage:exec
npm run triage:validate
npm run triage:approval
```

`npm run triage:exec` runs `codex exec` as a bounded CI-style triage worker. It produces a JSON report first; patch application remains a separate human-approved step.

The runner fails closed: it removes any prior report before starting and publishes `latest.json` only after Codex returns a non-empty new report.

`npm run triage:approval` validates the report first and requires an explicit operator name. It records approval only; it never applies a patch.

## Expected First State

The first `npm test` run fails intentionally. The reconciliation logic currently marks an unmatched PSP payment as `reconciled`, but the expected status is `pending_investigation`.

After Codex proposes and approval allows the minimal patch, `npm test` and `npm run typecheck` should pass.
