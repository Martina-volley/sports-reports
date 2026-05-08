import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { buildSite, validateReport } from "./build-site.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const incomingDir = path.join(rootDir, "new_incoming");
const reportsPath = path.join(rootDir, "data", "reports.json");

const args = new Set(process.argv.slice(2));
const shouldCommit = args.has("--commit") || args.has("--push");
const shouldPush = args.has("--push");
const keepIncoming = args.has("--keep-incoming");

function normalizeReport(report) {
  return {
    ...report,
    featured: Boolean(report.featured),
    latest: Boolean(report.latest)
  };
}

function compareReports(a, b) {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  return a.href.localeCompare(b.href);
}

function ensureInsideRoot(targetPath) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(rootDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Target path escapes repository root: ${resolved}`);
  }
  return resolved;
}

function ensureMatchingBasename(metadataPath, htmlPath, href) {
  const jsonBase = path.basename(metadataPath, ".json");
  const htmlBase = path.basename(htmlPath, ".html");
  const hrefBase = path.basename(href, ".html");

  if (jsonBase !== htmlBase || htmlBase !== hrefBase) {
    throw new Error(
      `Incoming pair mismatch: json=${jsonBase}, html=${htmlBase}, href=${hrefBase}`
    );
  }
}

async function readReports() {
  const raw = await readFile(reportsPath, "utf8");
  const reports = JSON.parse(raw);
  if (!Array.isArray(reports)) {
    throw new Error("data/reports.json must be an array");
  }
  reports.forEach(validateReport);
  return reports.map(normalizeReport);
}

async function collectIncomingPairs() {
  await mkdir(incomingDir, { recursive: true });
  const entries = await readdir(incomingDir, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const pairs = [];
  for (const jsonName of jsonFiles) {
    const metadataPath = path.join(incomingDir, jsonName);
    const htmlPath = path.join(incomingDir, `${path.basename(jsonName, ".json")}.html`);
    const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
    validateReport(metadata, jsonName);
    ensureMatchingBasename(metadataPath, htmlPath, metadata.href);

    try {
      await stat(htmlPath);
    } catch {
      throw new Error(`Missing HTML pair for ${jsonName}`);
    }

    pairs.push({
      metadataPath,
      htmlPath,
      report: normalizeReport(metadata)
    });
  }

  return pairs.sort((a, b) => compareReports(a.report, b.report));
}

function normalizeFlags(reports) {
  const sorted = [...reports].sort(compareReports);
  const featuredIndex = sorted.findIndex((report) => report.featured);
  const finalFeaturedIndex = featuredIndex === -1 ? 0 : featuredIndex;

  return sorted.map((report, index) => ({
    ...report,
    latest: index === 0,
    featured: index === finalFeaturedIndex
  }));
}

async function writeReports(reports) {
  const json = `${JSON.stringify(reports, null, 2)}\n`;
  await writeFile(reportsPath, json, "utf8");
}

function runCommand(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: rootDir,
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function getGitStatusLines() {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["status", "--porcelain"], {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `git status failed with exit code ${code}`));
        return;
      }
      resolve(stdout.split(/\r?\n/).filter(Boolean));
    });
  });
}

function toRepoRelative(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function ensureNoUnrelatedGitChanges(statusLines, allowedPaths) {
  const disallowed = statusLines.filter((line) => {
    const candidate = line.slice(3).trim().replaceAll("\\", "/");
    return candidate && !allowedPaths.has(candidate);
  });

  if (disallowed.length) {
    throw new Error(
      `Refusing to commit with unrelated working tree changes:\n${disallowed.join("\n")}`
    );
  }
}

async function publish() {
  const pairs = await collectIncomingPairs();

  if (pairs.length === 0) {
    console.log("No incoming report pairs found.");
    return;
  }

  const existingReports = await readReports();
  const reportsByHref = new Map(existingReports.map((report) => [report.href, report]));
  const publishedPaths = new Set([
    "data/reports.json",
    "index.html"
  ]);

  for (const pair of pairs) {
    const targetPath = ensureInsideRoot(path.join(rootDir, pair.report.href));
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(pair.htmlPath, targetPath);
    reportsByHref.set(pair.report.href, pair.report);
    publishedPaths.add(toRepoRelative(targetPath));
  }

  const normalizedReports = normalizeFlags([...reportsByHref.values()]);
  await writeReports(normalizedReports);
  await buildSite();

  if (!keepIncoming) {
    for (const pair of pairs) {
      await rm(pair.metadataPath, { force: true });
      await rm(pair.htmlPath, { force: true });
    }
  }

  console.log(
    `Published ${pairs.length} incoming report(s): ${pairs.map((pair) => pair.report.href).join(", ")}`
  );

  if (!shouldCommit) {
    return;
  }

  const allowedPaths = new Set(publishedPaths);
  const statusBeforeAdd = await getGitStatusLines();
  ensureNoUnrelatedGitChanges(statusBeforeAdd, allowedPaths);

  await runCommand("git", ["add", ...[...allowedPaths].sort()]);
  await runCommand("git", ["commit", "-m", `publish incoming reports (${pairs.length})`]);

  if (shouldPush) {
    await runCommand("git", ["push", "origin", "main"]);
  }
}

publish().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
