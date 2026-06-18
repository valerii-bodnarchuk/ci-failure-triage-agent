const COMMAND_ENV_KEYS = [
  "CODEX_TOOL_COMMAND",
  "CODEX_COMMAND",
  "CODEX_PROPOSED_COMMAND",
  "TOOL_COMMAND",
  "COMMAND"
] as const;

type BlockRule = {
  label: string;
  pattern: RegExp;
};

const BLOCK_RULES: BlockRule[] = [
  { label: "git push", pattern: /\bgit\s+push\b/i },
  { label: "git reset --hard", pattern: /\bgit\s+reset\s+--hard\b/i },
  { label: "git clean", pattern: /\bgit\s+clean\b/i },
  { label: "rm -rf", pattern: /\brm\s+-rf\b/i },
  { label: "sudo", pattern: /\bsudo\b/i },
  { label: "chmod 777", pattern: /\bchmod\s+777\b/i },
  { label: "cat .env", pattern: /\bcat\s+\.env\b/i },
  { label: "printenv", pattern: /\bprintenv\b/i },
  { label: "~/.ssh", pattern: /~\/\.ssh/i },
  { label: "private key", pattern: /private\s+key/i },
  { label: "OPENAI_API_KEY", pattern: /OPENAI_API_KEY/i },
  { label: "GITHUB_TOKEN", pattern: /GITHUB_TOKEN/i }
];

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => resolve(""), 100);
    timeout.unref();

    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
}

function readCommandFromEnvironment(): string {
  const values = COMMAND_ENV_KEYS.map((key) => process.env[key]).filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  return values.join("\n");
}

function findBlockedRule(command: string): BlockRule | undefined {
  return BLOCK_RULES.find((rule) => rule.pattern.test(command));
}

async function run(): Promise<void> {
  const command = `${await readStdin()}\n${readCommandFromEnvironment()}`.trim();

  if (command.length === 0) {
    return;
  }

  const blockedRule = findBlockedRule(command);

  if (!blockedRule) {
    return;
  }

  console.error(`Blocked command: matched guardrail "${blockedRule.label}".`);
  process.exitCode = 1;
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
