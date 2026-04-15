# 運動賽事分析頻道 · 報告存檔

F1、MLB、NPB、CPBL、WBC 賽事深度分析報告，聚焦台灣視角。

網站首頁：
`https://你的帳號.github.io/sports-reports/`

## 資料夾結構

```text
sports-reports/
├── index.html
├── f1/
│   └── 2026/
│       ├── miami-preview.html
│       ├── miami-race.html
│       └── ...
├── baseball/
│   └── 2026/
│       └── ...
└── assets/
    ├── favicon.svg
    └── site-preview.svg
```

## 檔名規則

| 類型 | 格式 | 範例 |
|------|------|------|
| F1 預告 | `{城市}-preview.html` | `miami-preview.html` |
| F1 賽後 | `{城市}-race.html` | `miami-race.html` |
| F1 記者會 | `{城市}-pressconf.html` | `miami-pressconf.html` |
| 棒球週報 | `mlb-taiwan-w{N}.html` | `mlb-taiwan-w20.html` |
| 棒球專題 | `{主題}.html` | `wbc-analysis.html` |

## GitHub Pages 上線流程

1. 在 GitHub 建立 repo，例如 `sports-reports`
2. 把這個資料夾內的內容放到 repo 根目錄
3. Push 到 GitHub
4. 到 GitHub 的 `Settings > Pages`
5. `Source` 選 `Deploy from a branch`
6. Branch 選 `main`，資料夾選 `/ (root)`
7. 等 1 到 2 分鐘，網址會是 `https://你的帳號.github.io/sports-reports/`

## 後續更新流程

1. 產生新報告 HTML
2. 依規則命名檔案，放進對應資料夾
3. 打開 `index.html`
4. 在 `#report-grid` 內新增一張卡片
5. 檢查首頁是否能點進新頁面
6. `git add .`
7. `git commit -m "add imola preview report"`
8. `git push`
9. 等 GitHub Pages 自動更新

## 新報告上線檢查

1. 檔名使用小寫英文與連字號
2. `href` 使用相對路徑，例如 `f1/2026/imola-preview.html`
3. HTML 有 `<meta charset="UTF-8" />`
4. 中文在瀏覽器開啟正常，不是終端顯示亂碼
5. 首頁卡片日期、類型、描述已更新
6. 頁面內若有外部腳本，確認 CDN 可正常載入

## index.html 卡片模板

首頁已內建「新增卡片模板速查」區塊。
新增報告時，直接打開 `index.html`，展開模板區塊，複製相符類型的卡片即可。
