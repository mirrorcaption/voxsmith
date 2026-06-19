# cf-whisper-demo

A minimal speech-to-text demo running entirely on Cloudflare's edge:

- **Worker** (`src/index.ts`) — accepts `POST /api/transcribe` with raw audio bytes, encodes to base64, runs `@cf/openai/whisper-large-v3-turbo` via the `AI` binding, returns JSON. Optional `?vocab=` query param is forwarded as Whisper's `initial_prompt` to bias recognition toward user-defined terms.
- **Static page** (`public/index.html`) — single-button MediaRecorder UI. Press to record, press again to stop & transcribe. Optional language / translate-to-English toggle. Includes a collapsible "自定义词汇" panel so users can list proper nouns / jargon (saved in `localStorage`) that the recognizer should spell correctly.
- **Static assets** served by Workers via the `[assets]` binding — no separate hosting.

Everything runs at the edge: the audio bytes hit the nearest Cloudflare PoP, Whisper inference happens on Workers AI, response comes back. No origin server.

## Setup

```bash
pnpm install        # or npm install
wrangler login      # if not already
```

## Develop locally

```bash
pnpm dev            # wrangler dev → http://localhost:8787
```

`wrangler dev` proxies Workers AI calls to Cloudflare even locally, so transcription works without deploying.

## Deploy

```bash
pnpm deploy         # wrangler deploy → https://cf-whisper-demo.<account>.workers.dev
```

## Notes

- Whisper input cap is ~30 seconds of audio per call. For longer streams you'd need to chunk client-side or switch to a streaming ASR provider (AssemblyAI, Deepgram, etc.).
- The `initial_prompt` used for custom vocabulary is a *soft* hint (≈224 tokens); Whisper will bias toward those spellings but does not guarantee them. For hard guarantees, a post-processing LLM pass (e.g. extending the existing refine step) would be more reliable.
- The page uses `MediaRecorder` in the browser default codec (typically `audio/webm;opus`). Whisper accepts most common formats via base64.
- Workers AI usage is billed under the Cloudflare account that runs `wrangler deploy`. Free tier includes a daily neuron allowance — see Cloudflare's pricing page for current quotas.
