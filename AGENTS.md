# Repository Instructions

This repo demonstrates controlled CI failure triage.

- Diagnose before modifying files.
- Prefer the minimal patch that fixes the demonstrated failure.
- Do not read or print secrets, `.env` files, tokens, private keys, credentials, or local machine config.
- Do not push commits.
- Do not perform broad rewrites.
- Do not add new dependencies without approval.
- For debugging tasks, return root cause, category, affected files, confidence, risk, proposed fix, and verification commands.
- Verification order: targeted test, full tests, typecheck.
