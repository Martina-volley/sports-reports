import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "worldcup-plan.json");
const outputPath = path.join(rootDir, "worldcup", "2026", "CONTENT_PLAN.md");

function statusLabel(status) {
  return {
    published: "已發布",
    ready: "待發布",
    planned: "企劃中",
    draft: "草稿中"
  }[status] || status;
}

function typeLabel(type) {
  return {
    group_preview: "分組預覽",
    deep_dive: "深度專題",
    matchday_preview: "觀賽前分析",
    daily_debrief: "賽後短評",
    tactical_review: "戰術復盤"
  }[type] || type;
}

const raw = await readFile(dataPath, "utf8");
const plan = JSON.parse(raw);
const items = [...plan.items].sort((a, b) => {
  const byDate = a.publishDate.localeCompare(b.publishDate);
  return byDate || a.id.localeCompare(b.id);
});

const lines = [
  "# World Cup 2026 發布計畫",
  "",
  `更新日期：${plan.updated}`,
  `時區：${plan.timezone}`,
  "",
  "## 發布節奏",
  "",
  "| 階段 | 日期區間 | 節奏 | 建議發布時間 |",
  "| --- | --- | --- | --- |",
  ...plan.rhythm.map((row) =>
    `| ${row.phase} | ${row.window} | ${row.cadence} | ${row.publishingSlot} |`
  ),
  "",
  "## 文章排程",
  "",
  "| 日期 | 時段 | 狀態 | 類型 | 標題 | 連結 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...items.map((item) => {
    const link = item.href ? `[open](../../${item.href})` : "";
    return `| ${item.publishDate} | ${item.slot} | ${statusLabel(item.status)} | ${typeLabel(item.type)} | ${item.title} | ${link} |`;
  }),
  "",
  "## 使用方式",
  "",
  "1. 編輯 `data/worldcup-plan.json`。",
  "2. 執行 `node scripts/build-worldcup-plan.mjs` 重建本檔。",
  "3. 單篇報導完成後，走 `new_incoming` 發布流程；若同時改 hub 或樣式，改用一般 commit/push。",
  ""
];

await writeFile(outputPath, `${lines.join("\n")}`, "utf8");
console.log(`Built ${path.relative(rootDir, outputPath)} from ${path.relative(rootDir, dataPath)}.`);
