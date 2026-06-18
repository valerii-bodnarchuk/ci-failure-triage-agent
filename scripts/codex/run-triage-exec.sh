#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd -P)"

PROMPT_FILE="${REPO_ROOT}/.github/codex/prompts/triage.md"
SCHEMA_FILE="${REPO_ROOT}/.github/codex/schemas/triage.schema.json"
REPORT_DIR="${REPO_ROOT}/triage/reports"
REPORT_PATH="${REPORT_DIR}/latest.json"
TMP_REPORT="${REPORT_PATH}.tmp"

cd "${REPO_ROOT}"
mkdir -p "${REPORT_DIR}"
trap 'rm -f "${TMP_REPORT}"' EXIT

# This installed Codex CLI supports read-only sandboxing for `codex exec`.
# It does not accept `--ask-for-approval on-request` on `codex exec`, so this
# runner relies on read-only sandboxing and an explicit human approval step.
{
  cat "${PROMPT_FILE}"
  cat <<'PROMPT'

Additional non-interactive worker instructions:

- Return only strict JSON matching .github/codex/schemas/triage.schema.json.
- Treat this as read-only CI triage.
- Do not modify source files.
- Do not install dependencies.
- Do not access the network beyond model access required by codex exec.
- Do not read or print secrets, .env files, tokens, private keys, credentials, or local machine config.
- Do not push commits.
- The intentional reconciliation bug must not be fixed in this step.
- Patch application is a separate human-approved step, so requiresHumanApproval must be true.
PROMPT
} | codex exec \
  --cd "${REPO_ROOT}" \
  --skip-git-repo-check \
  --ignore-user-config \
  --ephemeral \
  --sandbox read-only \
  --output-schema "${SCHEMA_FILE}" \
  --output-last-message "${TMP_REPORT}" \
  -

mv "${TMP_REPORT}" "${REPORT_PATH}"
trap - EXIT
echo "Codex triage report saved to ${REPORT_PATH}"
