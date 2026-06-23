# PiP Recorder 前端重设计

> 把 `public/index.html` 重构成 `design_handoff_pip_recorder/` 描述的"画中画小窗"形态，同时保留 voxsmith 现有的扩展功能（直连 API、自定义词汇、学习修改、BYO-only banner）。

## 一句话目标

参照 `design_handoff_pip_recorder/README.md` 的高保真规格，把右侧"录音小窗"改造成"默认极简一行、按需用 `pipWindow.resizeTo()` 改变窗口本身高度来腾出空间"的形态。所有扩展功能收纳进齿轮折叠面板，确保在 PiP 浮窗内也能完整操作。

## 改造策略（已与用户对齐）

- **原地重构 `public/index.html`**：保留全部现有 JS 逻辑（录音、上传、refine、词汇、learn、直连 API、BYO 检测），只重写 HTML 结构 / CSS 样式 / 受影响的 UI 绑定代码（`setExpanded`、`applyHeight`、`lastBtn` 行为等）。
- **扩展功能编排**：直连 API、自定义词汇、学习修改三个入口塞进齿轮设置折叠面板。BYO-only 顶部 banner 保留在主页面（不进 PiP）。
- **不引入新依赖**：单文件、纯 HTML/CSS/JS，沿用现有 vanilla 模式。

## 布局总览

舞台 = 居中 flex，两块并排：

```
┌─────────────────────────────┬─────────────────────────────┐
│ 左：启动面板 #mainPanel       │ 右：录音小窗 #pipFrame        │
│  - kicker 红点 + "实时语音转写"│  ┌── pip-bar 标题栏 ──┐      │
│  - h1 "边缘语音转写"          │  ├── #panel 主体 ────┤      │
│  - 副文                      │  │  A. 结果区(隐)    │      │
│  - hero #popBtn 弹出小窗     │  │  B. 声波条       │      │
│  - 提示 #hint               │  │  C. 操作行       │      │
│  - (可选)BYO banner          │  │  D. 设置折叠面板(隐) │     │
│                              │  │  E. 状态        │      │
│                              │  └─────────────────┘      │
└─────────────────────────────┴─────────────────────────────┘
```

启动面板的扩展功能按钮（自定义词汇、学习修改、直连 API）**移除**——它们改由齿轮设置面板提供。BYO-only banner 保留在启动面板上方，因为它需要在用户填凭据之前就可见。

## `#panel` 主体结构

| 区块 | 默认状态 | 触发显示条件 | 内容 |
|---|---|---|---|
| A. `#resultWrap` 结果区 | 隐藏 | `.panel.expanded` | 头部 `转写结果` 标签 + `#copyBtn` 图标按钮（26×26）；`#result` contenteditable 框（min-height 132、max 300） |
| B. `.wave` 声波条 | 隐藏 | `.panel:has(#recordBtn.danger)` | 9 根 3px 竖条，红 `--accent`，错相位 `eq` 动画 |
| C. `.actions` 操作行 | **常显** | — | `#recordBtn`（flex:1）+ `#lastBtn` 胶囊 + `#settingsBtn` 齿轮（30×30） |
| D. `#settingsPop` 折叠面板 | 隐藏 | `#settingsBtn.open` 时 `.open` | Refine 模式 select、自动复制开关、**词汇按钮**、**学习按钮**、**直连 API 按钮**、**词汇/学习/API 三个 modal 触发** |
| E. `#status` 状态行 | **常显** | — | 11.5px 居中；录音时前置脉冲红点 |

### 设置折叠面板 D 的扩展条目（关键变化）

折叠面板从上到下：

1. `Refine 模式` 小标签 + `#modeSel` 全宽 select（5 个选项保持不变）
2. `.opt-row` + 自定义滑动开关 `#autoCopyChk`（替换默认 checkbox）
3. **分隔细线 1px var(--line)**
4. `自定义` 小标签
5. 一行两个胶囊按钮：`#vocabBtn`（自定义词汇 + 计数徽章）/ `#learnBtn`（学习修改，转写后才启用）
6. **分隔细线**
7. `#apiSettingsBtn`（直连 API · 用自己的额度 + 状态徽章 `未启用` / `已启用` / `已启用 · refine`）

modal（`#vocabModal`、`#learnModal`、`#apiModal`）的 backdrop 仍挂在主文档；当用户在 PiP 窗口里点这三个按钮时，**关闭 PiP 窗口（或失焦）后** modal 才能展示。**简化方案**：所有 modal 在主文档显示；点击时调用 `pipWindow?.focus()` 或退而求其次，把 modal 内容克隆进 PiP 文档。

**决策（取简）**：modal 始终在主文档显示，点击 PiP 内的按钮时通过 `window.opener?.focus()` 把焦点切回主页面后再 `openModal()`。这避免了 modal 在 PiP 小矩形里被裁切的视觉灾难，也避免双份样式同步。

## PiP 窗口尺寸常量

| 常量 | 值（px） | 说明 |
|---|---|---|
| `PIP_W` | 330 | 固定宽 |
| `PIP_H_COLLAPSED` | 196 | 结果未展开时的"基础高" |
| `PIP_H_EXPANDED` | 440 | 结果展开时的"基础高"（替代 COLLAPSED，不叠加） |
| `PIP_H_SETTINGS` | 200 | 设置面板展开时的**增量**（比设计稿原 132 增加 ~68，因为多了词汇/学习/API 三条） |

`currentHeight()` = `(resultExpanded ? PIP_H_EXPANDED : PIP_H_COLLAPSED) + (settingsOpen ? PIP_H_SETTINGS : 0)`

总高范围：196（仅操作行）→ 440（结果展开）→ 396（操作行 + 设置）→ 640（结果 + 设置）。

> 实施时若 `PIP_H_SETTINGS=200` 实测过短/过长，按内容自然高度微调，不影响其它逻辑。

## 设计 Token（沿用现有，已对齐 C&A 品牌）

| Token | 值 |
|---|---|
| `--bg` | `#ECE9E4` |
| `--panel` | `#FFFFFF` |
| `--fg` / `--navy` | `#293756` |
| `--muted` | `#6E7689` |
| `--faint` | `#A6AAB4` |
| `--line` | `rgba(41,55,86,.12)` |
| `--line-strong` | `rgba(41,55,86,.22)` |
| `--inset` | `#F3F1ED` |
| `--accent` / `--accent-hover` | `#EE2031` / `#D2192A` |
| `--accent-2` | `#84AAB5` |
| `--ok` | `#3E6B77` |
| 圆角 | 16 / 10 / 8 |
| 面板 padding | 18 |
| 字体 | `"CA Sans", "Helvetica Neue", ..., sans-serif` |
| 卡片阴影 | `0 18px 48px -22px rgba(41,55,86,.45), 0 0 0 1px rgba(41,55,86,.04)` |

## 交互行为

### 弹出 PiP（`openPiP`）

不变：不支持 → 设 `#hint`；支持 → `requestWindow({ width: 330, height: 196 })`、克隆模板、`copyStyles`、切 `activeDoc`、`wireControls()`、`setExpanded(false)`、`setSettingsOpen(false)`。

### `#lastBtn` "上次结果"胶囊

- 点击 / Enter / Space → `setExpanded(!resultExpanded)`：切 `.panel.expanded`、文案在`上次结果`↔`收起`、`chev` 旋转 180°、`applyHeight()`。
- hover（仅 `.has-text` 且未展开）→ 显示 `#lastTip` 预览气泡（navy 底 / 白字 / 上方绝对定位 / 底部渐隐）。
- 转写成功且文本非空 → 自动 `setExpanded(true)`。

### `#settingsBtn` 齿轮

- 点击 toggle `#settingsPop.open` + `#settingsBtn.open`（齿轮旋转 35°、色变红） + `applyHeight()`。
- 在活动文档（含 PiP 文档）绑一次 `pointerdown` 关闭器：点面板/按钮外即关。

### 录音 / 停止

不变。长按 ≥350ms 弹 `.stop-menu`（停止并复制 / 停止不复制），拖动选项。

### 复制

`#copyBtn` 与 `autoCopy` 共用。`#result.oninput` 时按文本启/禁 `#copyBtn`、并 `updateLastTip()`。

### 设置面板内三个扩展按钮

点击时：
1. 若当前在 PiP 文档 → `window.opener.focus()`（或 `pipWindow == null` 直接 noop）
2. `openModal('vocab'|'learn'|'api')` —— 主文档显示 modal
3. 折叠面板自动关闭（与现有"点外部关闭"逻辑一致）

## 持久化（localStorage）

不变 + 现有：`refineMode`、`autoCopy`、`vocab`、`apiAccount`/`apiToken`/`apiCerebras`。

## 文件改动范围

只动 `public/index.html`：
- `<style>` 块（行 7–664）：全部替换为符合设计 token 的 CSS
- HTML 结构（行 666–795）：按上方布局重写
- `<script type="module">`（行 797–1633）：保留 90% 现有逻辑；改动点：
  - 新增 `setExpanded` / `setSettingsOpen` / `applyHeight`
  - 新增 `wireLastBtn` 处理胶囊点击 + hover 气泡
  - `wireControls` 重新组织（绑定新的 DOM 节点）
  - `copyStyles` 已存在，不动
  - 上传成功路径里加 `if (text) setExpanded(true)`

`public/blog.html`、`src/`、`public/refine-prompts.js`：**不动**。

## 已检视的回归风险

1. **MediaRecorder mime 候选** — 不动
2. **PiP iframe fallback** — 不动（保留 `#hint` 错误文案路径）
3. **直连 API 模式** — 凭据按钮虽搬位置，但 modal/逻辑不动
4. **BYO-only 模式** — 顶部 banner 路径不动
5. **学习修改** — 触发点位置变（折叠面板里），但 modal 和 diff 算法不动
6. **自动复制开关** — 视觉换成自定义滑动 + 同 `#autoCopyChk` id，业务逻辑不动
7. **长按停止菜单** — 不动
8. **声波动画** — 选择器 `.panel:has(#recordBtn.danger) .wave` 需要现代 Chrome；与设计稿一致
9. **PiP 内点击 modal 按钮** — 通过 `opener.focus()` + 主文档 modal 解决；若 opener 为 null（极端情况）则降级为在 PiP 内 inline 显示词汇列表

## 验收清单

- [ ] 主页面打开默认展示：启动面板 + pip-frame 预览，右侧极简一行（录音 + 胶囊 + 齿轮）
- [ ] 点 hero → PiP 弹出，初始高 196，仅一行操作
- [ ] 录音 + 转写完成 → PiP 自动 resizeTo 440，结果区展开可编辑
- [ ] 点齿轮 → 高度加到 396（结果未展开）或 640（结果已展开），可见 Refine 模式、自动复制、词汇按钮、学习按钮、直连 API 按钮
- [ ] PiP 内点词汇/学习/API → 主文档前置且 modal 弹出
- [ ] 长按录音按钮 → 停止菜单
- [ ] hover "上次结果" → 蓝底白字预览气泡
- [ ] 直连 API 状态徽章在折叠面板内正常变 `未启用`/`已启用`/`已启用 · refine`
- [ ] BYO-only 部署：顶部黄色 banner 仍在主页面顶部
- [ ] `npm run typecheck` 通过

## 不在本次范围

- blog.html 重设计
- 后端 `/api/transcribe` 协议改动
- Refine prompts 内容变更
- 移动端单独适配（沿用现有 wrap 行为）
