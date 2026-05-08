import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const templatePath = path.join(rootDir, "src", "index.template.html");
const dataPath = path.join(rootDir, "data", "reports.json");
const outputPath = path.join(rootDir, "index.html");

export function validateReport(report, index) {
  const required = ["href", "league", "type", "date", "title", "summary", "seasonLabel"];

  for (const key of required) {
    if (!report[key] || typeof report[key] !== "string") {
      throw new Error(`reports[${index}].${key} is required and must be a string`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(report.date)) {
    throw new Error(`reports[${index}].date must be YYYY-MM-DD`);
  }
}

export async function buildSite() {
  const [template, dataRaw] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(dataPath, "utf8")
  ]);

  const reports = JSON.parse(dataRaw);
  if (!Array.isArray(reports)) {
    throw new Error("data/reports.json must be an array");
  }

  reports.forEach(validateReport);
  const normalized = [...reports].sort((a, b) => b.date.localeCompare(a.date));
  const json = JSON.stringify(normalized, null, 2);
  const output = template.replace("__REPORTS_JSON__", json);

  await writeFile(outputPath, output, "utf8");
  console.log(`Built ${path.relative(rootDir, outputPath)} with ${normalized.length} reports.`);
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isEntrypoint) {
  buildSite().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
