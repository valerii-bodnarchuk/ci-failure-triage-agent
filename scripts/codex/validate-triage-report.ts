import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type TriageReport = {
  category?: unknown;
  rootCause?: unknown;
  confidence?: unknown;
  affectedFiles?: unknown;
  riskLevel?: unknown;
  requiresHumanApproval?: unknown;
  proposedPatchSummary?: unknown;
  verificationCommands?: unknown;
};

const reportPath = resolve("triage/reports/latest.json");
const categories = new Set(["app_bug", "test_bug", "dependency", "config", "flaky_test", "unknown"]);
const riskLevels = new Set(["low", "medium", "high"]);
const requiredFields = [
  "category",
  "rootCause",
  "confidence",
  "affectedFiles",
  "riskLevel",
  "requiresHumanApproval",
  "proposedPatchSummary",
  "verificationCommands"
] as const;
const allowedFields = new Set<string>(requiredFields);

function fail(message: string): never {
  console.error(`Invalid triage report: ${message}`);
  process.exit(1);
}

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${field} must be a non-empty string`);
  }
}

function assertStringArray(value: unknown, field: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    fail(`${field} must be an array`);
  }

  if (!value.every((item) => typeof item === "string" && item.trim().length > 0)) {
    fail(`${field} must contain only non-empty strings`);
  }
}

async function run(): Promise<void> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(reportPath, "utf8"));
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`could not read or parse ${reportPath}: ${detail}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail("report must be a JSON object");
  }

  const report = parsed as TriageReport;
  const unexpectedFields = Object.keys(report).filter((field) => !allowedFields.has(field));

  if (unexpectedFields.length > 0) {
    fail(`contains unsupported field(s): ${unexpectedFields.join(", ")}`);
  }

  for (const field of requiredFields) {
    if (!(field in report)) {
      fail(`missing required field ${field}`);
    }
  }

  if (!categories.has(String(report.category))) {
    fail(`category must be one of ${Array.from(categories).join(", ")}`);
  }

  assertString(report.rootCause, "rootCause");

  if (typeof report.confidence !== "number" || report.confidence < 0 || report.confidence > 1) {
    fail("confidence must be a number between 0 and 1");
  }

  assertStringArray(report.affectedFiles, "affectedFiles");

  if (!riskLevels.has(String(report.riskLevel))) {
    fail(`riskLevel must be one of ${Array.from(riskLevels).join(", ")}`);
  }

  if (typeof report.requiresHumanApproval !== "boolean") {
    fail("requiresHumanApproval must be a boolean");
  }

  assertString(report.proposedPatchSummary, "proposedPatchSummary");
  assertStringArray(report.verificationCommands, "verificationCommands");

  console.log(`Valid triage report: ${reportPath}`);
}

run().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  fail(detail);
});
