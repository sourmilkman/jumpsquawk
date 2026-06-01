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

function makeMessage(role: TranscriptMessage["role"], text: string): TranscriptMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    at: new Date().toISOString()
  };
}

export async function startRealtimeSession(
  instructions: string,
  gatewayUrl: string,
  voice: RealtimeVoice,
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
  remoteAudio.setAttribute("playsinline", "true");

  peer.ontrack = (event) => {
    remoteAudio.srcObject = event.streams[0];
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
    dataChannel.send(JSON.stringify({ type: "response.create" }));
  });

  dataChannel.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    const text =
      payload?.transcript ??
      payload?.delta ??
      payload?.item?.content?.[0]?.transcript ??
      payload?.response?.output?.[0]?.content?.[0]?.transcript;

    if (typeof text === "string" && text.trim()) {
      const role = payload?.item?.role === "user" ? "learner" : "tutor";
      handlers.onMessage(makeMessage(role, text.trim()));
    }

    if (payload?.type === "response.audio.done") {
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
    const detail = await response.text();
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
      dataChannel.send(JSON.stringify({ type: "response.create" }));
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
        handlers.onMessage(
          makeMessage("tutor", "Muy bien. Puedes decir un poco mas? Usa una frase corta.")
        );
        handlers.onStatus("listening");
      }, 650);
    }
  };
}
