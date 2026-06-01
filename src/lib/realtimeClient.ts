export type RealtimeStatus =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "listening"
  | "speaking"
  | "ended"
  | "error";

export type TranscriptMessage = {
  id: string;
  role: "tutor" | "learner" | "system";
  text: string;
  translation?: string;
  at: string;
};

export type RealtimeEventHandlers = {
  onStatus: (status: RealtimeStatus) => void;
  onMessage: (message: TranscriptMessage) => void;
  onError: (message: string) => void;
};

export type RealtimeSession = {
  stop: () => void;
  sendText: (text: string) => void;
};

export type RealtimeVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "sage"
  | "shimmer"
  | "verse"
  | "marin";

function normalizeSpanish(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeMessage(
  role: TranscriptMessage["role"],
  text: string,
  translation?: string
): TranscriptMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    translation,
    at: new Date().toISOString()
  };
}

function createResponseEvent() {
  return JSON.stringify({ type: "response.create" });
}

async function readGatewayError(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return "Could not start live voice practice.";

  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === "string") return parsed.error;
    if (
      parsed.error &&
      typeof parsed.error === "object" &&
      "message" in parsed.error &&
      typeof parsed.error.message === "string"
    ) {
      return parsed.error.message;
    }
  } catch {
    return body;
  }

  return body;
}

export async function startRealtimeSession(
  instructions: string,
  gatewayUrl: string,
  voice: RealtimeVoice,
  audioOutput: boolean,
  handlers: RealtimeEventHandlers
): Promise<RealtimeSession> {
  handlers.onStatus("requesting-mic");

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support microphone capture.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  handlers.onStatus("connecting");

  const peer = new RTCPeerConnection();
  const dataChannel = peer.createDataChannel("oai-events");
  const remoteAudio = document.createElement("audio");
  remoteAudio.autoplay = true;
  remoteAudio.muted = !audioOutput;
  remoteAudio.volume = audioOutput ? 1 : 0;
  remoteAudio.style.display = "none";
  remoteAudio.setAttribute("playsinline", "true");
  document.body.appendChild(remoteAudio);

  peer.ontrack = (event) => {
    remoteAudio.srcObject = event.streams[0];
    void remoteAudio.play().catch(() => {
      handlers.onError("Tutor audio is blocked. Tap Start again, or check browser/site sound permissions.");
    });
    handlers.onStatus("speaking");
  };

  stream.getTracks().forEach((track) => peer.addTrack(track, stream));

  dataChannel.addEventListener("open", () => {
    handlers.onStatus("listening");
    dataChannel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Start the Spanish lesson now. Greet me in Spanish and ask the first question."
            }
          ]
        }
      })
    );
    dataChannel.send(createResponseEvent());
  });

  dataChannel.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    const text = payload?.transcript ?? payload?.item?.content?.[0]?.transcript;
    const isCompleteTranscript =
      payload?.type === "response.output_audio_transcript.done" ||
      payload?.type === "conversation.item.done" ||
      payload?.type === "conversation.item.input_audio_transcription.completed";

    if (isCompleteTranscript && typeof text === "string" && text.trim()) {
      const role = payload?.item?.role === "user" ? "learner" : "tutor";
      handlers.onMessage(makeMessage(role, text.trim()));
    }

    if (payload?.type === "response.audio.done" || payload?.type === "response.output_audio.done") {
      handlers.onStatus("listening");
    }
  });

  dataChannel.addEventListener("error", () => {
    handlers.onError("Realtime data channel failed.");
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  const base = gatewayUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/realtime/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sdp: offer.sdp, instructions, voice })
  });

  if (!response.ok) {
    const detail = await readGatewayError(response);
    throw new Error(detail || "Could not start live voice practice.");
  }

  await peer.setRemoteDescription({
    type: "answer",
    sdp: await response.text()
  });

  return {
    stop: () => {
      dataChannel.close();
      peer.close();
      stream.getTracks().forEach((track) => track.stop());
      remoteAudio.pause();
      remoteAudio.srcObject = null;
      remoteAudio.remove();
      handlers.onStatus("ended");
    },
    sendText: (text: string) => {
      if (dataChannel.readyState !== "open") return;
      handlers.onMessage(makeMessage("learner", text));
      dataChannel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }]
          }
        })
      );
      dataChannel.send(createResponseEvent());
    }
  };
}

export function startDemoSession(
  starter: string,
  handlers: RealtimeEventHandlers
): RealtimeSession {
  let stopped = false;
  handlers.onStatus("connecting");

  window.setTimeout(() => {
    if (stopped) return;
    handlers.onStatus("listening");
    handlers.onMessage(makeMessage("tutor", starter));
  }, 450);

  return {
    stop: () => {
      stopped = true;
      handlers.onStatus("ended");
    },
    sendText: (text: string) => {
      handlers.onMessage(makeMessage("learner", text));
      handlers.onStatus("speaking");
      window.setTimeout(() => {
        if (stopped) return;
        handlers.onMessage(makeMessage("tutor", buildDemoReply(text)));
        handlers.onStatus("listening");
      }, 650);
    }
  };
}

export function buildDemoReply(text: string): string {
  const normalized = normalizeSpanish(text);
  const hasGreeting = /\b(hola|buenos dias|buenas)\b/.test(normalized);
  const hasName = /\b(me llamo|mi nombre es|soy)\b/.test(normalized);
  const hasMuchoGusto = normalized.includes("mucho gusto");
  const asksHowAreYou = normalized.includes("como estas") || normalized.includes("que tal");
  const saysGood = /\b(bien|muy bien|estoy bien)\b/.test(normalized);

  if (hasMuchoGusto && asksHowAreYou) {
    return "Mucho gusto tambien. Estoy bien, gracias. Y tu, como estas?";
  }

  if (hasMuchoGusto) {
    return "Mucho gusto. Ahora preguntame: Como estas?";
  }

  if (asksHowAreYou) {
    return "Estoy bien, gracias. Y tu?";
  }

  if (hasName && hasGreeting) {
    return "Mucho gusto. Puedes decir: Mucho gusto, Lucia.";
  }

  if (hasName) {
    return "Mucho gusto. Puedes preguntarme: Y tu, como te llamas?";
  }

  if (saysGood) {
    return "Me alegro. Di una frase mas: Estoy aprendiendo espanol.";
  }

  return "Muy bien. Puedes decir un poco mas? Usa una frase corta.";
}
