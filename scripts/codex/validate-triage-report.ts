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
  let parsed: TriageReport;

  try {
    parsed = JSON.parse(await readFile(reportPath, "utf8")) as TriageReport;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`could not read or parse ${reportPath}: ${detail}`);
  }

  for (const field of requiredFields) {
    if (!(field in parsed)) {
      fail(`missing required field ${field}`);
    }
  }

  if (!categories.has(String(parsed.category))) {
    fail(`category must be one of ${Array.from(categories).join(", ")}`);
  }

  assertString(parsed.rootCause, "rootCause");

  if (typeof parsed.confidence !== "number" || parsed.confidence < 0 || parsed.confidence > 1) {
    fail("confidence must be a number between 0 and 1");
  }

  assertStringArray(parsed.affectedFiles, "affectedFiles");

  if (!riskLevels.has(String(parsed.riskLevel))) {
    fail(`riskLevel must be one of ${Array.from(riskLevels).join(", ")}`);
  }

  if (typeof parsed.requiresHumanApproval !== "boolean") {
    fail("requiresHumanApproval must be a boolean");
  }

  assertString(parsed.proposedPatchSummary, "proposedPatchSummary");
  assertStringArray(parsed.verificationCommands, "verificationCommands");

  console.log(`Valid triage report: ${reportPath}`);
}

run().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  fail(detail);
});
