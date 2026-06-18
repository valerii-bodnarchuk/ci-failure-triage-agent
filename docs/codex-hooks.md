# Codex Hook Guardrail

This repository includes a project-local PreToolUse-style guard script at `scripts/codex/pre-tool-guard.ts`.

The guard is meant to inspect a proposed shell command before Codex runs it. It is a demo safety layer for blocking obviously dangerous commands, not a replacement for sandboxing, approval policy, or human review.

## Blocked Commands

The guard blocks proposed commands containing:

- `git push`
- `git reset --hard`
- `git clean`
- `rm -rf`
- `sudo`
- `chmod 777`
- `cat .env`
- `printenv`
- `~/.ssh`
- `private key`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`

If no proposed command is available on stdin or in a known command environment variable, the guard exits successfully and does nothing.

## Not Enabled Automatically

This hook is not enabled automatically.

This repository does not modify global Codex configuration, does not touch `~/.codex`, and does not trust the hook unless a human explicitly wires it into a local or CI workflow.

## Demo Safety Model

The guard fits into the demo safety model as one additional boundary:

- sandbox limits what tools can access
- approval policy controls risky actions
- structured output keeps triage reports machine-checkable
- human approval separates diagnosis from patch application
- hook guardrail blocks known dangerous command patterns before execution

Run the guard manually with:

```sh
npm run codex:guard
```

For a dry run with stdin:

```sh
printf 'npm test\n' | npm run codex:guard
```
