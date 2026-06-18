# CI Failure Triage Agent

This is a small TypeScript demo project for a controlled Codex workflow that triages CI failures without immediately changing code.

## Demo Flow

1. A test fails intentionally.
2. The failure log is captured in `triage/samples/failure.log`.
3. Codex runs a read-only triage prompt.
4. Codex returns a structured JSON report matching `.github/codex/schemas/triage.schema.json`.
5. A risk and approval boundary is checked before any patch work.
6. Codex proposes a minimal patch.
7. Verification commands are run after the patch is approved and applied.

## Safety Boundary

- Diagnosis happens before modification.
- The triage prompt is read-only.
- No secrets, `.env` files, tokens, keys, credentials, or local machine config should be read or printed.
- No git push.
- No broad rewrites.
- No new dependencies without approval.

## Commands

```sh
npm install
npm test
npm run typecheck
npm run triage:collect
npm run triage:approval
```

## Non-interactive Codex worker

```sh
npm run triage:collect
npm run triage:exec
npm run triage:validate
npm run triage:approval
```

`npm run triage:exec` runs `codex exec` as a bounded CI-style triage worker. It produces a JSON report first; patch application remains a separate human-approved step.

## Expected First State

The first `npm test` run fails intentionally. The reconciliation logic currently marks an unmatched PSP payment as `reconciled`, but the expected status is `pending_investigation`.

After Codex proposes and approval allows the minimal patch, `npm test` and `npm run typecheck` should pass.
