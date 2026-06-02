import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
const fallbackVoice = process.env.OPENAI_REALTIME_VOICE || "coral";
const realtimeVoices = new Set(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin"]);

app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: ["application/sdp", "text/plain"], limit: "1mb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    realtimeReady: Boolean(process.env.OPENAI_API_KEY),
    model,
    voice: fallbackVoice
  });
});

app.post("/api/realtime/session", async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    res.status(400).json({
      error: "OPENAI_API_KEY is not configured. Demo mode is still available."
    });
    return;
  }

  const sdp = typeof req.body === "string" ? req.body : req.body?.sdp;
  const instructions =
    typeof req.body === "object" && req.body !== null ? req.body.instructions : undefined;
  const requestedVoice = typeof req.body === "object" && req.body !== null ? req.body.voice : undefined;
  const voice = realtimeVoices.has(requestedVoice) ? requestedVoice : fallbackVoice;

  if (!sdp || typeof sdp !== "string") {
    res.status(400).json({ error: "Expected SDP offer text." });
    return;
  }

  const session = {
    type: "realtime",
    model,
    instructions,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe"
        }
      },
      output: {
        voice
      }
    }
  };

  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set("session", JSON.stringify(session));

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const answer = await response.text();
    if (!response.ok) {
      res.status(response.status).json({ error: answer || "Realtime session failed." });
      return;
    }

    res.type("application/sdp").send(answer);
  } catch (error) {
    console.error("Realtime session error", error);
    res.status(500).json({ error: "Could not create a realtime session." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Jumpsquawk API listening on http://localhost:${port}`);
});
