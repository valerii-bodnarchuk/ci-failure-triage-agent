import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type TriageReport = {
  riskLevel?: "low" | "medium" | "high";
  requiresHumanApproval?: boolean;
  affectedFiles?: string[];
};

const latestReportPath = resolve("triage/reports/latest.json");
const approvalPath = resolve("triage/reports/approval.json");
const validatorPath = resolve("scripts/codex/validate-triage-report.ts");

function readApprovedBy(args: string[]): string | null {
  const index = args.indexOf("--approved-by");
  const value = index === -1 ? undefined : args[index + 1];

  if (args.filter((arg) => arg === "--approved-by").length !== 1 || !value || value.startsWith("--")) {
    return null;
  }

  const approvedBy = value.trim();
  return approvedBy.length > 0 ? approvedBy : null;
}

async function validateLatestReport(): Promise<boolean> {
  return new Promise((resolveValidation) => {
    const child = spawn(process.execPath, ["--import", "tsx", validatorPath], {
      stdio: "inherit"
    });

    child.on("error", (error: Error) => {
      console.error(`Could not validate triage report: ${error.message}`);
      resolveValidation(false);
    });

    child.on("close", (code) => resolveValidation(code === 0));
  });
}

async function readLatestReport(): Promise<TriageReport | null> {
  try {
    const raw = await readFile(latestReportPath, "utf8");
    return JSON.parse(raw) as TriageReport;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function run(): Promise<void> {
  const approvedBy = readApprovedBy(process.argv.slice(2));

  if (!approvedBy) {
    console.error("Approval requires --approved-by <name>");
    process.exitCode = 1;
    return;
  }

  if (!(await validateLatestReport())) {
    process.exitCode = 1;
    return;
  }

  const report = await readLatestReport();

  if (!report) {
    console.error(`No triage report found at ${latestReportPath}`);
    process.exitCode = 1;
    return;
  }

  if (report.riskLevel !== "low" && report.riskLevel !== "medium") {
    console.error("Refusing approval unless riskLevel is low or medium");
    process.exitCode = 1;
    return;
  }

  if (report.requiresHumanApproval !== true) {
    console.error("Refusing approval because requiresHumanApproval is not true");
    process.exitCode = 1;
    return;
  }

  const approval = {
    approvedBy,
    timestamp: new Date().toISOString(),
    riskLevel: report.riskLevel,
    affectedFiles: report.affectedFiles ?? []
  };

  await mkdir(dirname(approvalPath), { recursive: true });
  await writeFile(approvalPath, `${JSON.stringify(approval, null, 2)}\n`, "utf8");
  console.log(`Approval recorded at ${approvalPath}`);
  console.log("No patches were applied automatically.");
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
