# Read-Only CI Failure Triage

You are performing read-only CI failure triage for this repository.

Inspect only the files needed for diagnosis:

- `AGENTS.md`
- `triage/samples/failure.log`
- `package.json`
- relevant source and test files referenced by the failure log

Constraints:

- Do not modify files.
- Do not install dependencies.
- Do not access the network.
- Do not read or print secrets, `.env` files, tokens, private keys, credentials, or local machine config.
- Return only JSON matching `.github/codex/schemas/triage.schema.json`.

Identify:

- root cause
- category
- affected files
- confidence
- risk level
- whether human approval is required
- proposed minimal patch summary
- verification commands
