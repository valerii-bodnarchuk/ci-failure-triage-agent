import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";

const logPath = resolve("triage/samples/failure.log");

async function run(): Promise<void> {
  await mkdir(dirname(logPath), { recursive: true });

  const result = await new Promise<{ code: number | null; output: string }>((resolveProcess) => {
    const child = spawn("npm", ["test"], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let output = "";

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => resolveProcess({ code, output }));
  });

  const header = [
    "CI Failure Triage Agent captured test output",
    `Command: npm test`,
    `Exit code: ${result.code ?? "unknown"}`,
    ""
  ].join("\n");

  await writeFile(logPath, `${header}${result.output}`, "utf8");
  console.log(`Failure log saved to ${logPath}`);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
