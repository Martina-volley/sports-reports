# 運動賽事分析頻道 · 報告存檔

F1、MLB、NPB、CPBL、WBC 賽事深度分析報告，聚焦台灣視角。

**網站首頁**：`https://Martina-volley.github.io/sports-reports`

---

## 資料夾結構

```
sports-reports/
├── index.html              ← 目錄首頁（每次新增報告都要更新）
├── f1/
│   └── 2026/
│       ├── miami-preview.html
│       ├── miami-race.html
│       └── ...
├── baseball/
│   └── 2026/
│       └── ...
└── assets/
    └── og-image.png
```

## 每次新增報告的步驟

1. 在 Claude 生成 HTML 報告
2. 將檔案依照命名規則放進對應資料夾
3. 更新 `index.html`，在 `#report-grid` 內加入新的 `.report-card`
4. Push 到 GitHub，約 1–2 分鐘後自動上線

## 檔名規則

| 類型 | 格式 | 範例 |
|------|------|------|
| F1 預告 | `{城市}-preview.html` | `miami-preview.html` |
| F1 賽後 | `{城市}-race.html` | `miami-race.html` |
| F1 記者會 | `{城市}-pressconf.html` | `miami-pressconf.html` |
| 棒球週報 | `mlb-taiwan-w{N}.html` | `mlb-taiwan-w20.html` |
| 棒球專題 | `{主題}.html` | `wbc-analysis.html` |

## 新增報告到 index.html

複製以下模板，貼到 `index.html` 的 `report-grid` 區塊內：

```html
<a class="report-card"
   href="f1/2026/FILENAME.html"
   data-league="f1"
   data-type="preview">
  <div class="card-stripe" style="background: linear-gradient(90deg, #e8002d, #b44fff);"></div>
  <div class="card-body">
    <div class="card-meta">
      <span class="type-tag tag-preview">預告報告</span>
      <span class="card-date">2026.MM.DD</span>
    </div>
    <div class="card-title">🏁 城市名大獎賽</div>
    <div class="card-desc">
      Round N · 一句描述重點<br>
      第二行補充
    </div>
    <div class="card-footer">
      <span class="card-league">F1 2026 · Round N</span>
      <span class="card-arrow">→</span>
    </div>
  </div>
</a>
```

**data-league**：`f1` 或 `baseball`  
**data-type**：`preview` / `race` / `press` / `sprint` / `baseball`
