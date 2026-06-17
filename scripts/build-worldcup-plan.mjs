import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "worldcup-plan.json");
const outputPath = path.join(rootDir, "worldcup", "2026", "CONTENT_PLAN.md");

function zh(value) {
  return value;
}

function statusLabel(status) {
  return {
    published: zh("\u5df2\u767c\u5e03"),
    ready: zh("\u5f85\u767c\u5e03"),
    planned: zh("\u4f01\u5283\u4e2d"),
    draft: zh("\u8349\u7a3f\u4e2d")
  }[status] || status;
}

function typeLabel(type) {
  return {
    group_preview: zh("\u5206\u7d44\u9810\u89bd"),
    deep_dive: zh("\u6df1\u5ea6\u5c08\u984c"),
    storyline: zh("\u7126\u9ede\u6545\u4e8b"),
    matchday_preview: zh("\u8cfd\u524d\u5206\u6790"),
    daily_debrief: zh("\u8cfd\u5f8c\u5206\u6790"),
    tactical_review: zh("\u6230\u8853\u56de\u9867")
  }[type] || type;
}

function draftLabel(item) {
  if (!item.draftDate && !item.draftSlot) {
    return "";
  }
  return [item.draftDate, item.draftSlot].filter(Boolean).join(" ");
}

function compareItems(a, b) {
  const byDate = a.publishDate.localeCompare(b.publishDate);
  if (byDate !== 0) {
    return byDate;
  }

  const byDraft = (a.draftSlot || "").localeCompare(b.draftSlot || "");
  return byDraft || a.id.localeCompare(b.id);
}

const raw = await readFile(dataPath, "utf8");
const plan = JSON.parse(raw);
const items = [...plan.items].sort(compareItems);

const lines = [
  "# World Cup 2026 \u5167\u5bb9\u8a08\u756b",
  "",
  `\u66f4\u65b0\u65e5\u671f\uff1a${plan.updated}`,
  `\u6642\u5340\uff1a${plan.timezone}`,
  "",
  "## \u767c\u5e03\u7bc0\u594f",
  "",
  "| \u968e\u6bb5 | \u6642\u9593\u7bc4\u570d | \u7bc0\u594f | \u624b\u52d5\u767c\u5e03\u6642\u6bb5 |",
  "| --- | --- | --- | --- |",
  ...plan.rhythm.map((row) =>
    `| ${row.phase} | ${row.window} | ${row.cadence} | ${row.publishingSlot} |`
  ),
  "",
  "## \u5167\u5bb9\u6392\u7a0b",
  "",
  "| \u767c\u5e03\u65e5 | \u81ea\u52d5\u7522\u7a3f\u6642\u9593 | \u767c\u5e03\u6642\u6bb5 | \u72c0\u614b | \u985e\u578b | \u6a19\u984c | \u9023\u7d50 |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...items.map((item) => {
    const link = item.href ? `[open](../../${item.href})` : "";
    return `| ${item.publishDate} | ${draftLabel(item)} | ${item.publishSlot || item.slot || ""} | ${statusLabel(item.status)} | ${typeLabel(item.type)} | ${item.title} | ${link} |`;
  }),
  "",
  "## \u4f7f\u7528\u65b9\u5f0f",
  "",
  "1. \u4fee\u6539 `data/worldcup-plan.json`\u3002",
  "2. \u57f7\u884c `node scripts/build-worldcup-plan.mjs` \u91cd\u65b0\u7522\u751f\u672c\u8868\u3002",
  "3. \u65b0\u7522\u751f\u7684 `.html + .json` \u61c9\u653e\u5165 `new_incoming`\uff0c\u6aa2\u67e5\u5f8c\u518d\u624b\u52d5\u767c\u5e03\u3002",
  "4. \u767c\u5e03\u5f8c\u9808\u6aa2\u67e5 `data/reports.json`\u3001Hub \u8207 plan \u72c0\u614b\uff0c\u518d commit/push\u3002",
  ""
];

await writeFile(outputPath, `${lines.join("\n")}`, "utf8");
console.log(`Built ${path.relative(rootDir, outputPath)} from ${path.relative(rootDir, dataPath)}.`);
