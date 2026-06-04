# World Cup 2026 發布計畫

更新日期：2026-06-04
時區：Asia/Taipei

## 發布節奏

| 階段 | 日期區間 | 節奏 | 建議發布時間 |
| --- | --- | --- | --- |
| pre_tournament | 2026-06-04 to 2026-06-10 | 1 group preview or long read per day | 20:00-22:00 |
| group_stage | 2026-06-11 to 2026-06-27 | matchday preview at night, daily debrief after matches | Preview 20:00-22:00, Debrief 12:00-15:00 |
| knockout_stage | 2026-06-28 to 2026-07-18 | preview every matchday, review selected matches | Preview previous night, Review after matchday |
| final_week | 2026-07-19 onward | final preview, final review, tournament wrap | as match schedule allows |

## 文章排程

| 日期 | 時段 | 狀態 | 類型 | 標題 | 連結 |
| --- | --- | --- | --- | --- | --- |
| 2026-06-04 | published | 已發布 | 分組預覽 | A 組：主辦國、開幕戰，和一組不太安分的對手 | [open](../../worldcup/2026/group-a-preview.html) |
| 2026-06-05 | published | 已發布 | 分組預覽 | H 組：西班牙的控球、烏拉圭的刀口，和首次登場的島國夢 | [open](../../worldcup/2026/group-h-preview.html) |
| 2026-06-06 | 20:00-22:00 | 企劃中 | 深度專題 | 48 隊之後，世界盃變寬了嗎？ | [open](../../worldcup/2026/format-long-read.html) |
| 2026-06-07 | 20:00-22:00 | 企劃中 | 分組預覽 | I 組：法國、塞內加爾、挪威與伊拉克 | [open](../../worldcup/2026/group-i-preview.html) |
| 2026-06-08 | 20:00-22:00 | 企劃中 | 分組預覽 | L 組：英格蘭、克羅埃西亞、迦納與巴拿馬 | [open](../../worldcup/2026/group-l-preview.html) |
| 2026-06-09 | 20:00-22:00 | 企劃中 | 深度專題 | 三國十六城，誰的腿最累？ | [open](../../worldcup/2026/host-map-long-read.html) |
| 2026-06-10 | 20:00-22:00 | 企劃中 | 分組預覽 | C 組：巴西、摩洛哥、海地與蘇格蘭 | [open](../../worldcup/2026/group-c-preview.html) |

## 使用方式

1. 編輯 `data/worldcup-plan.json`。
2. 執行 `node scripts/build-worldcup-plan.mjs` 重建本檔。
3. 單篇報導完成後，走 `new_incoming` 發布流程；若同時改 hub 或樣式，改用一般 commit/push。
