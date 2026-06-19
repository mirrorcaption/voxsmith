# Handoff: 边缘语音转写 — 画中画录音小窗 UI 重设计

## Overview
A voice-to-text utility that pops itself out as a system-level Picture-in-Picture (PiP)
floating window (`documentPictureInPicture`). The window always floats on top of any app,
records mic audio, sends it to a transcription endpoint, and lets the user edit/copy the
result. This handoff covers a **trend-forward UI redesign** of the launcher panel and the
floating recording window, keeping 100% of the original functionality.

## About the Design Files
`index.reference.html` is a **design reference created in HTML** — a working prototype that
demonstrates the intended look, layout, and interaction behavior. It is **not meant to be
shipped as-is**. The task is to **recreate this design inside the target codebase** using its
existing environment and conventions (React / Vue / Svelte / vanilla, whatever the project
uses). If there is no existing front-end yet, pick the most appropriate framework and
implement it there. The PiP / MediaRecorder logic in the reference file is correct and
battle-tested — port the behavior, but render the UI with the codebase's own component and
styling patterns.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and micro-
interactions are all specified below. Recreate the UI pixel-accurately, then wire it to the
real transcription backend.

---

## Screens / Views

The app has **one page** containing two visual surfaces laid out side-by-side on a centered
flex stage. In production, the right surface (the recording controls) is what actually pops
out into the PiP window; the side-by-side layout exists so the design (and a fallback inline
mode) can be seen and used when PiP is unavailable.

### 1. Launcher panel (left)
- **Purpose**: Entry point. Explains the tool and triggers the pop-out.
- **Layout**: Vertical flex, `gap: 14px`, padding `20px`. Fixed width `348px` on the stage.
  Glassmorphism card.
- **Components**:
  - **Kicker** — small uppercase eyebrow. Text: `实时语音转写`. `font-size: 10.5px`,
    `font-weight: 700`, `letter-spacing: 0.18em`, `text-transform: uppercase`, color `#888EA3`.
    Preceded by a 7×7px gradient "bead" dot (accent gradient, glow `0 0 12px rgba(110,123,255,.9)`).
  - **Title (h1)** — `边缘语音转写`. `font-size: 21px`, `font-weight: 700`,
    `letter-spacing: -0.02em`, `line-height: 1.15`, color `#ECECF3`.
  - **Subtext (p.sub)** — `把工具弹成系统级"画中画"小窗 —— 始终浮在最上层，切到任何应用都能录音转写，转完直接复制。`
    `font-size: 12.5px`, `line-height: 1.55`, color `#888EA3`.
  - **Hero button (#popBtn)** — full width, `padding: 15px 18px`, `font-size: 15px`,
    radius `14px`, accent gradient background, shadow
    `0 14px 34px -12px rgba(110,123,255,.9), inset 0 0 0 1px rgba(255,255,255,.08)`.
    Label `弹出录音小窗`. A small "pop-out" icon precedes it (13×13px white 2px border
    rounded square with an offset `box-shadow: 4px -4px 0 -1px #6E7BFF` to suggest a second
    window). Hover deepens the glow.
  - **Hint (p.sub#hint)** — status/help line under the button. Default text:
    `右侧是小窗的实时预览，可直接录音试用。`

### 2. Recording small-window (right) — *the redesigned PiP surface*
- **Purpose**: The actual recording UI. In production this is the content of the PiP window.
- **Layout**: A "window" frame (`#pipFrame`, fixed width `360px`) = title bar + body.
  Inside it the control panel renders chrome-less (transparent, no border/shadow), `gap: 14px`,
  padding `20px`.
  - **Title bar (.pip-bar)**: `padding: 11px 16px`, bottom border `1px rgba(255,255,255,.08)`,
    bg `rgba(255,255,255,.03)`. Left: three 10px traffic-light dots (`#FF5F57`, `#FEBC2E`,
    `#28C840`). Center-left label `录音小窗 · 预览` (`11px`, `font-weight: 650`, color `#888EA3`).
    Right: a `LIVE` tag (`9px`, `700`, `letter-spacing: 0.14em`, uppercase, color `#5A5F73`)
    with a 6px green (`#34D399`) glowing dot before it.
    > In the real PiP window the title bar is provided by the OS — render only the panel body there.
- **Components (top → bottom)**:
  1. **Field label** — `REFINE 模式`. `10.5px`, `700`, `letter-spacing: 0.16em`, uppercase,
     color `#5A5F73`, `margin-bottom: -6px`.
  2. **Mode select (#modeSel)** — full-width custom select. bg `rgba(0,0,0,.28)`, border
     `1px rgba(255,255,255,.08)`, radius `14px`, `padding: 12px 36px 12px 14px`,
     `font-size: 13px`, `font-weight: 550`. Custom CSS caret (two 6px gradient triangles at
     right). Focus: border `#6E7BFF` + ring `0 0 0 3px rgba(110,123,255,.22)`. Options:
     | value | label |
     |---|---|
     | `clean` | 清理 · 去口头语 / 修标点 |
     | `polish` | 轻结构化 · 邮件 / 聊天 |
     | `structure-en` | 结构化 Prompt · 英文输出 |
     | `structure-zh` | 结构化 Prompt · 中文输出 |
     | `raw` | 原始 · 不处理 |
  3. **Button row (.row)** — flex, `gap: 10px`:
     - **Record button (#recordBtn)** — `flex: 1`, pill, radius `14px`, `padding: 13px 16px`,
       `font-weight: 650`, `gap: 9px`.
       - *Idle* (`.primary`): accent gradient bg, shadow
         `0 10px 26px -10px rgba(110,123,255,.85)`. Leading 10px white record dot
         (`::before`, glow `0 0 10px rgba(255,255,255,.6)`). Label `开始说话`.
       - *Recording* (`.danger`): danger gradient bg, shadow
         `0 10px 26px -10px rgba(255,77,109,.85)`, runs `recPulse` 1.6s breathing animation.
         Leading 11px white rounded square (stop glyph). Label `停止`.
     - **Copy button (#copyBtn)** — `.ghost`, `flex: 0 0 auto`, min-width `52px`,
       `padding: 13px`, bg `rgba(255,255,255,.06)`, border `1px rgba(255,255,255,.14)`,
       color `#ECECF3`. Label `复制`. Disabled (opacity `.42`) until a result exists.
  4. **Waveform (.wave)** — equalizer shown **only while recording**. 9 vertical bars,
     `width: 3px`, `gap: 4px`, danger gradient, each running `eq` 0.9s with staggered negative
     delays. Collapsed (`height: 0; opacity: 0`) when idle; expands to `height: 26px; opacity: 1`
     via the selector `.panel:has(#recordBtn.danger) .wave`.
  5. **Auto-copy toggle (.opt-row + #autoCopyChk)** — a custom switch (NOT a default checkbox).
     Track `36×21px`, radius `999px`, bg `rgba(255,255,255,.1)` / accent gradient when checked;
     15px white knob slides `translateX(15px)` with spring easing
     `cubic-bezier(0.34,1.56,0.64,1)`. Label `结束后自动复制（长按"停止"可临时切换）`,
     `font-size: 12px`, color `#888EA3`.
  6. **Status (#status)** — `font-size: 11.5px`, `font-weight: 550`, color `#888EA3`.
     Variants: `.ok` → `#34D399`, `.error` → `#FF4D6D`. While recording it shows a pulsing
     7px red dot (`.dot`, `pulse` 1s) + text.
  7. **Result (#result)** — `contenteditable` transcript area. bg `rgba(0,0,0,.32)`,
     border `1px rgba(255,255,255,.08)`, radius `14px`, `padding: 13px 14px`,
     `font-size: 13.5px`, `line-height: 1.6`, `min-height: 70px`, `max-height: 220px`,
     scrollable. Empty placeholder via `::before`: `转写结果会出现在这里 · 可直接编辑`
     (color `#5A5F73`). Focus: border `#6E7BFF` + ring `0 0 0 3px rgba(110,123,255,.18)`.
     Custom 8px scrollbar thumb `rgba(255,255,255,.12)`.

### 3. Long-press stop menu (overlay)
- **Trigger**: while recording, press-and-hold the record button ≥ `350ms`.
- **Appearance**: fixed-position floating menu (`.stop-menu`) positioned just above the record
  button, `animation: menuIn 0.14s`. Two glass option cards (`.stop-opt`):
  bg `rgba(24,25,36,.92)` + blur, border `1px rgba(255,255,255,.14)`, radius `14px`,
  `padding: 12px 16px`, `font-size: 13px`, `font-weight: 600`, shadow
  `0 10px 28px -8px rgba(0,0,0,.6)`.
  - `停止并复制` (data-mode `copy`)
  - `停止不复制` (data-mode `review`)
- **Hot state** (`.hot`, finger/cursor over an option): accent gradient bg, white text,
  `transform: scale(1.04)`, glow shadow.

---

## Interactions & Behavior

- **Pop out (#popBtn click → `openPiP`)**:
  - If `documentPictureInPicture` unsupported → set hint text, keep using the inline preview.
  - Else `documentPictureInPicture.requestWindow({ width: 372, height: 340 })`. On success,
    clone the control template into the PiP document, copy `<style>`/`<link>` nodes over
    (`copyStyles`), set `activeDoc` to the PiP document, re-wire controls, and replace the
    inline preview with a "已在画中画小窗中打开" note. **Note: PiP can only be requested from a
    top-level browsing context — it throws inside iframes; the code catches this and falls
    back to the inline preview.**
  - On PiP `pagehide`: stop any active recording, restore the inline preview (`mountPreview`),
    reset the button.
- **Record / stop (#recordBtn `pointerdown` → `onRecordPointerDown`)**:
  - Not recording: on pointer-up, clear the result and `startRecording()` (getUserMedia → new
    `MediaRecorder`, mime picked from a candidate list).
  - Recording: start a `350ms` long-press timer.
    - Short press (release before timer) → `stopRecording()` (uses the auto-copy toggle value).
    - Long press → `showOptionsMenu()`; dragging highlights an option (`elementFromPoint`);
      release picks it (`copy` forces auto-copy on, `review` forces it off).
- **Stop → upload (`upload`)**: `POST /api/transcribe?mode=<modeSel.value>` with the audio
  Blob as body and `Content-Type` = blob type. Response JSON: read `data.text` (or
  `data.transcription_text`); optional `data.label` appended to the success status. If
  auto-copy is pending and text exists → copy to clipboard.
- **Copy (#copyBtn / auto)**: `navigator.clipboard.writeText`, fallback to a hidden textarea +
  `execCommand('copy')`. Status reflects success/failure.
- **Result editing**: `#result` is contenteditable; on input, enable/disable the copy button
  based on whether it has trimmed text.
- **Animations**: `recPulse` 1.6s (record btn glow), `eq` 0.9s (waveform bars), `pulse` 1s
  (status dot), `menuIn` 0.14s (stop menu), switch knob spring 0.2s, button `active` scale
  `0.975`.
- **Responsive**: the stage is `flex-wrap: wrap`, `width: max-content`, `max-width: 100%` —
  the two surfaces sit side-by-side on wide viewports and stack on narrow ones.

## State Management
- `pipWindow` — the active PiP window handle (or null).
- `activeDoc` — the document currently holding the live controls (main doc inline, or the PiP
  doc). All DOM lookups go through `$ = id => (activeDoc||document).getElementById(id)`.
- `mediaRecorder`, `stream`, `chunks` — recording session.
- `longPressTimer`, `menuActive`, `menuEl` — long-press stop-menu state.
- `autoCopyPending` — whether to auto-copy after the next transcription resolves.
- **Persisted (localStorage)**: `refineMode` (selected mode), `autoCopy` (`"1"`/`"0"`).

## Design Tokens

| Token | Value |
|---|---|
| `--bg` | `#07070b` (+ two radial accent glows, see body) |
| `--panel` | `rgba(18, 19, 28, 0.78)` (glass, `backdrop-filter: blur(22px) saturate(140%)`) |
| `--panel-solid` | `#11121b` (select option bg) |
| `--fg` | `#ECECF3` |
| `--muted` | `#888EA3` |
| `--faint` | `#5A5F73` |
| `--line` | `rgba(255, 255, 255, 0.08)` |
| `--line-strong` | `rgba(255, 255, 255, 0.14)` |
| `--accent` | `#6E7BFF` |
| `--accent-2` | `#4DA6FF` |
| `--accent-grad` | `linear-gradient(135deg, #7C5CFF 0%, #4D8DFF 100%)` |
| `--danger` | `#FF4D6D` |
| `--danger-grad` | `linear-gradient(135deg, #FF5470 0%, #FF7A4D 100%)` |
| `--ok` | `#34D399` |
| Radii | `--r-lg 22px`, `--r-md 14px`, `--r-sm 11px` |
| Spacing | panel padding `20px`; panel gap `14px`; button row gap `10px`; stage gap `24px` |
| Type | system stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif` |
| Panel shadow | `0 24px 60px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)` |

## Assets
None. No images or icon fonts — all icons (record dot, stop square, pop-out glyph, caret,
traffic lights, switch knob) are pure CSS. Fonts are system fonts.

## Backend contract (must be implemented in the real app)
`POST /api/transcribe?mode=<mode>` — body: raw audio bytes; `Content-Type` = the recorded
blob's mime type (e.g. `audio/webm;codecs=opus`). Response: `200` JSON `{ text | transcription_text,
label? }`; non-2xx JSON `{ error }`.

## Files
- `index.reference.html` — the full working HTML reference (UI + PiP + MediaRecorder logic).
  Open it in a top-level Chrome/Edge 116+ tab to see the real PiP pop-out; inside an iframe it
  falls back to the inline preview.

## Browser support
PiP (`documentPictureInPicture`) requires Chromium 116+ and a top-level browsing context.
Always provide the inline/fallback path for other browsers.
