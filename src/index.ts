import {
  buildSystemPrompt,
  MODE_LABELS,
  parseMode,
  type Mode,
} from "./refine/prompts";

export interface Env {
  AI: Ai;
  ASSETS: Fetcher;
  OPENAI_API_KEY: string;
  BASIC_AUTH_PASSWORD?: string;
  PUBLIC_BYO_ONLY?: string;
}

function isByoOnly(env: Env): boolean {
  const v = (env.PUBLIC_BYO_ONLY ?? "").toLowerCase().trim();
  return v === "1" || v === "true";
}

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_REFINE_CHARS = 12000;
const MAX_PROMPT_CHARS = 800;
const MAX_VOCAB_ENTRIES = 64;
const WHISPER_MODEL = "@cf/openai/whisper-large-v3-turbo";
const REFINE_MODEL = "gpt-5.4-mini";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

function parseVocabList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .slice(0, MAX_PROMPT_CHARS * 2)
    .split(/[\n,，、;；]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_VOCAB_ENTRIES);
}

function buildInitialPrompt(vocab: string): string {
  const hasCJK = /[一-鿿]/.test(vocab);
  return hasCJK
    ? `本段语音可能涉及以下专有名词:${vocab}。`
    : `Common terms in this audio: ${vocab}.`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function refineText(
  text: string,
  mode: Mode,
  vocab: string[],
  env: Env,
): Promise<string | null> {
  if (mode === "raw") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not configured");
    return null;
  }

  const built = buildSystemPrompt(mode, trimmed, vocab);
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: built.system },
  ];
  if (built.examples) {
    for (const ex of built.examples) {
      messages.push({ role: "user", content: ex.user });
      messages.push({ role: "assistant", content: ex.assistant });
    }
  }
  messages.push({ role: "user", content: trimmed });

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: REFINE_MODEL, messages }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`OpenAI ${mode} ${res.status}:`, body.slice(0, 300));
      return null;
    }
    const data = (await res.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch (err) {
    console.error(`${mode} failed:`, err);
    return null;
  }
}

function checkBasicAuth(request: Request, env: Env): Response | null {
  const expected = env.BASIC_AUTH_PASSWORD;
  if (!expected) return null;
  const header = request.headers.get("authorization");
  if (header && header.startsWith("Basic ")) {
    try {
      const decoded = new TextDecoder().decode(
        Uint8Array.from(atob(header.slice(6).trim()), (c) => c.charCodeAt(0)),
      );
      const sep = decoded.indexOf(":");
      const supplied = sep >= 0 ? decoded.slice(sep + 1) : decoded;
      if (supplied === expected) return null;
    } catch {
      // fall through
    }
  }
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="voxsmith"',
      "Cache-Control": "no-store",
    },
  });
}

interface CloudflareAIResponse {
  result?: { text?: string; transcription_text?: string };
  success?: boolean;
  errors?: Array<{ message?: string }>;
}

async function handleTranscribeDirect(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio too large. Limit is 25 MB." }, { status: 413 });
  }

  const accountId = (request.headers.get("x-cf-account-id") ?? "").trim();
  const apiToken = (request.headers.get("x-cf-api-token") ?? "").trim();
  if (!accountId || !apiToken) {
    return Response.json(
      { error: "Missing X-CF-Account-Id or X-CF-Api-Token header" },
      { status: 400 },
    );
  }

  const audioBuffer = await request.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return Response.json({ error: "Empty audio body." }, { status: 400 });
  }

  const url = new URL(request.url);
  const vocabRaw = url.searchParams.get("vocab")?.trim();
  const initialPrompt = vocabRaw
    ? buildInitialPrompt(vocabRaw.slice(0, MAX_PROMPT_CHARS))
    : undefined;

  const base64 = arrayBufferToBase64(audioBuffer);
  const body: Record<string, string> = { audio: base64, task: "transcribe" };
  if (initialPrompt) body.initial_prompt = initialPrompt;

  const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${WHISPER_MODEL}`;
  const upstream = await fetch(cfUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  let data: CloudflareAIResponse | null = null;
  try {
    data = (await upstream.json()) as CloudflareAIResponse;
  } catch {
    // fall through with data = null
  }

  if (!upstream.ok || !data || data.success === false) {
    const message =
      data?.errors?.[0]?.message ?? `HTTP ${upstream.status} ${upstream.statusText}`;
    return Response.json({ error: message }, { status: upstream.status || 502 });
  }

  const text = (data.result?.text ?? data.result?.transcription_text ?? "").trim();
  return Response.json({
    text,
    raw: text,
    mode: "raw" as Mode,
    refined: false,
    label: "直连 · 你的额度",
  });
}

async function handleTranscribe(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio too large. Limit is 25 MB." }, { status: 413 });
  }

  const audioBuffer = await request.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return Response.json({ error: "Empty audio body." }, { status: 400 });
  }

  const url = new URL(request.url);
  const language = url.searchParams.get("language") ?? undefined;
  const task = url.searchParams.get("task") === "translate" ? "translate" : "transcribe";
  const mode = parseMode(url.searchParams.get("mode"));
  const vocabRaw = url.searchParams.get("vocab")?.trim();
  const vocabList = parseVocabList(vocabRaw);
  const initialPrompt = vocabRaw
    ? buildInitialPrompt(vocabRaw.slice(0, MAX_PROMPT_CHARS))
    : undefined;

  const base64 = arrayBufferToBase64(audioBuffer);

  const whisper = (await env.AI.run(WHISPER_MODEL, {
    audio: base64,
    task,
    ...(language ? { language } : {}),
    ...(initialPrompt ? { initial_prompt: initialPrompt } : {}),
  })) as { text?: string; transcription_text?: string };

  const raw = (whisper.text ?? whisper.transcription_text ?? "").trim();

  if (!raw || mode === "raw") {
    return Response.json({ text: raw, raw, mode, refined: false, label: null });
  }

  const refined = await refineText(raw, mode, vocabList, env);
  return Response.json({
    text: refined ?? raw,
    raw,
    mode,
    refined: refined !== null,
    label: refined !== null ? MODE_LABELS[mode] : null,
  });
}

interface RefineRequestBody {
  text?: unknown;
  mode?: unknown;
  vocab?: unknown;
}

async function handleRefine(request: Request, env: Env): Promise<Response> {
  let body: RefineRequestBody;
  try {
    body = (await request.json()) as RefineRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }
  if (text.length > MAX_REFINE_CHARS) {
    return Response.json(
      { error: `Text too long. Limit is ${MAX_REFINE_CHARS} chars.` },
      { status: 413 },
    );
  }

  const mode = parseMode(typeof body.mode === "string" ? body.mode : null);
  if (mode === "raw") {
    return Response.json({ text, raw: text, mode, refined: false, label: null });
  }

  const vocabList = Array.isArray(body.vocab)
    ? body.vocab
        .filter((v): v is string => typeof v === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_VOCAB_ENTRIES)
    : [];

  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Refine 服务未配置（缺少 OPENAI_API_KEY）。请改用 Cerebras 直连。" },
      { status: 503 },
    );
  }

  const refined = await refineText(text, mode, vocabList, env);
  if (refined === null) {
    return Response.json({ error: "Refine failed" }, { status: 502 });
  }
  return Response.json({
    text: refined,
    raw: text,
    mode,
    refined: true,
    label: MODE_LABELS[mode],
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const unauthorized = checkBasicAuth(request, env);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);

    if (url.pathname === "/api/config") {
      return Response.json({ byoOnly: isByoOnly(env) });
    }

    if (url.pathname === "/api/refine") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      try {
        return await handleRefine(request, env);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname === "/api/transcribe") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      if (isByoOnly(env)) {
        return Response.json(
          {
            error:
              "This deployment is BYO-only. Configure your own Cloudflare Account ID and API Token in the 直连 API panel.",
          },
          { status: 403 },
        );
      }
      try {
        return await handleTranscribe(request, env);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ error: message }, { status: 500 });
      }
    }

    if (url.pathname === "/api/transcribe-direct") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      try {
        return await handleTranscribeDirect(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return Response.json({ error: message }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
