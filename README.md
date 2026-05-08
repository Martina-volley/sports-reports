# Sports Reports

這個 repo 是一個部署到 GitHub Pages 的靜態網站，用來整理 F1 與棒球相關的分析報告。

## 目前結構

```text
sports-reports/
├─ assets/
│  ├─ favicon.svg
│  ├─ site-preview.svg
│  ├─ site.css
│  └─ site.js
├─ data/
│  └─ reports.json
├─ f1/
│  └─ 2026/
├─ baseball/
├─ scripts/
│  └─ build-site.mjs
├─ src/
│  └─ index.template.html
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
└─ index.html
```

## 維護方式

首頁不再手動寫卡片，而是由 `data/reports.json` 產生。

新增一篇報告時：

1. 新增實際報告 HTML，例如 `f1/2026/imola-preview.html`
2. 在 `data/reports.json` 加上一筆資料
3. 執行 `node scripts/build-site.mjs`
4. 確認 `index.html` 更新後 commit / push

## 自動發布

repo 已包含 GitHub Actions workflow：

- 當 `main` branch 有 push 時，會自動執行 `node scripts/build-site.mjs`
- build 完成後會自動 deploy 到 GitHub Pages

第一次使用時，請在 GitHub repository 設定中確認：

1. `Settings`
2. `Pages`
3. `Build and deployment`
4. `Source` 設為 `GitHub Actions`

## reports.json 欄位

每一筆報告至少需要這些欄位：

```json
{
  "href": "f1/2026/miami-race.html",
  "league": "f1",
  "type": "race",
  "date": "2026-05-04",
  "title": "邁阿密大獎賽 賽後分析",
  "summary": "Antonelli 三連勝，Mercedes 雙冠穩住榜首。",
  "seasonLabel": "F1 2026 · Round 4"
}
```

可選欄位：

- `kicker`
- `secondary`
- `tagLabel`
- `accent`
- `featured`
- `latest`

## 本機建置

```bash
node scripts/build-site.mjs
```
