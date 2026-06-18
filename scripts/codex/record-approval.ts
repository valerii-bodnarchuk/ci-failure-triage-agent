import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type TriageReport = {
  riskLevel?: "low" | "medium" | "high";
  requiresHumanApproval?: boolean;
  affectedFiles?: string[];
};

const latestReportPath = resolve("triage/reports/latest.json");
const approvalPath = resolve("triage/reports/approval.json");

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
  const report = await readLatestReport();

  if (!report) {
    console.error(`No triage report found at ${latestReportPath}`);
    process.exitCode = 1;
    return;
  }

  if (report.riskLevel === "high") {
    console.error("Refusing approval for high-risk triage report");
    process.exitCode = 1;
    return;
  }

  if (report.requiresHumanApproval !== true) {
    console.error("Refusing approval because requiresHumanApproval is not true");
    process.exitCode = 1;
    return;
  }

  const approval = {
    approvedBy: "human",
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
