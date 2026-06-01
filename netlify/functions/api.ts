declare const Netlify: {
  env: {
    get: (name: string) => string | undefined;
  };
};

const defaultAllowedOrigins = [
  "https://sourmilkman.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const realtimeVoices = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
  "marin"
]);

function env(name: string): string | undefined {
  return Netlify.env.get(name);
}

function allowedOrigins(): string[] {
  return (
    env("GATEWAY_ALLOWED_ORIGINS")
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? defaultAllowedOrigins
  );
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowed = allowedOrigins();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin"
  };

  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json"
    }
  });
}

async function readSessionRequest(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await req.json()) as {
      sdp?: unknown;
      instructions?: unknown;
      voice?: unknown;
    };
  }

  return { sdp: await req.text() };
}

async function handleHealth(req: Request): Promise<Response> {
  const model = env("OPENAI_REALTIME_MODEL") || "gpt-realtime";
  const voice = env("OPENAI_REALTIME_VOICE") || "coral";

  return json(req, {
    ok: true,
    realtimeReady: Boolean(env("OPENAI_API_KEY")),
    model,
    voice
  });
}

async function handleRealtimeSession(req: Request): Promise<Response> {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) {
    return json(req, { error: "OPENAI_API_KEY is not configured." }, 400);
  }

  const body = await readSessionRequest(req);
  const sdp = typeof body.sdp === "string" ? body.sdp : "";
  const instructions = typeof body.instructions === "string" ? body.instructions : undefined;
  const requestedVoice = typeof body.voice === "string" ? body.voice : undefined;
  const fallbackVoice = env("OPENAI_REALTIME_VOICE") || "coral";
  const voice = requestedVoice && realtimeVoices.has(requestedVoice) ? requestedVoice : fallbackVoice;
  const model = env("OPENAI_REALTIME_MODEL") || "gpt-realtime";

  if (!sdp) {
    return json(req, { error: "Expected SDP offer text." }, 400);
  }

  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set(
    "session",
    JSON.stringify({
      type: "realtime",
      model,
      instructions,
      audio: {
        output: {
          voice
        }
      }
    })
  );

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  const answer = await response.text();
  if (!response.ok) {
    return json(req, { error: answer || "Realtime session failed." }, response.status);
  }

  return new Response(answer, {
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/sdp"
    }
  });
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);
  if (url.pathname === "/api/health" && req.method === "GET") {
    return handleHealth(req);
  }

  if (url.pathname === "/api/realtime/session" && req.method === "POST") {
    return handleRealtimeSession(req);
  }

  return json(req, { error: "Not found." }, 404);
};

export const config = {
  path: ["/api/health", "/api/realtime/session"],
  method: ["GET", "POST", "OPTIONS"]
};
