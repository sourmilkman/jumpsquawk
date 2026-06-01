export type SpeechRecognitionHandle = {
  stop: () => void;
};

export type UtteranceBuffer = {
  add: (text: string) => void;
  flush: () => void;
  cancel: () => void;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEvent = Event & {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const candidate = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

export function supportsSpeechRecognition(): boolean {
  return Boolean(getSpeechRecognition());
}

export function createUtteranceBuffer(options: {
  delayMs?: number;
  onCommit: (text: string) => void;
  onPreview?: (text: string) => void;
}): UtteranceBuffer {
  const delayMs = options.delayMs ?? 1400;
  let current = "";
  let lastCommitted = "";
  let lastCommittedAt = 0;
  let timer: number | undefined;

  function normalize(text: string): string {
    return text.trim().replace(/\s+/g, " ");
  }

  function chooseBetter(previous: string, next: string): string {
    const normalizedPrevious = normalize(previous);
    const normalizedNext = normalize(next);
    const previousLower = normalizedPrevious.toLocaleLowerCase();
    const nextLower = normalizedNext.toLocaleLowerCase();

    if (!normalizedPrevious) return normalizedNext;
    if (nextLower.startsWith(previousLower)) return normalizedNext;
    if (previousLower.startsWith(nextLower)) return normalizedPrevious;
    return normalizedNext.length >= normalizedPrevious.length ? normalizedNext : normalizedPrevious;
  }

  function commit() {
    const text = normalize(current);
    window.clearTimeout(timer);
    timer = undefined;
    current = "";
    options.onPreview?.("");

    if (!text) return;

    const textLower = text.toLocaleLowerCase();
    const committedLower = lastCommitted.toLocaleLowerCase();
    const now = Date.now();
    if (textLower === committedLower && now - lastCommittedAt < 12000) {
      return;
    }

    lastCommitted = text;
    lastCommittedAt = now;
    options.onCommit(text);
  }

  return {
    add: (text) => {
      current = chooseBetter(current, text);
      options.onPreview?.(current);
      window.clearTimeout(timer);
      timer = window.setTimeout(commit, delayMs);
    },
    flush: commit,
    cancel: () => {
      window.clearTimeout(timer);
      timer = undefined;
      current = "";
      options.onPreview?.("");
    }
  };
}

export function startSpeechRecognition(options: {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onUnavailable: (message: string) => void;
  onListening?: () => void;
  onAudioStart?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}): SpeechRecognitionHandle | null {
  const Recognition = getSpeechRecognition();
  if (!Recognition) {
    options.onUnavailable("Speech recognition is not available in this browser. Use live mode or type a reply.");
    return null;
  }

  const recognition = new Recognition();
  let stopped = false;

  recognition.lang = "es-ES";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    options.onListening?.();
  };

  recognition.onaudiostart = () => {
    options.onAudioStart?.();
  };

  recognition.onspeechstart = () => {
    options.onSpeechStart?.();
  };

  recognition.onspeechend = () => {
    window.setTimeout(() => options.onSpeechEnd?.(), 450);
  };

  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";

    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript.trim();
      if (!transcript) continue;

      if (result.isFinal) {
        finalText = transcript;
      } else {
        interim = transcript;
      }
    }

    if (finalText) {
      options.onFinal(finalText);
    }

    options.onInterim(interim || finalText);
  };

  recognition.onerror = (event) => {
    const errorName = "error" in event ? String(event.error) : "";
    const message =
      errorName === "not-allowed" || errorName === "service-not-allowed"
        ? "Microphone permission is blocked for speech recognition. Allow mic access in Chrome site settings."
        : errorName === "no-speech"
          ? "I did not hear speech. Try speaking closer to the phone, then tap the mic again."
          : "Speech recognition stopped. Check Android microphone/browser permissions.";
    options.onUnavailable(message);
  };

  recognition.onend = () => {
    if (!stopped) {
      try {
        recognition.start();
      } catch {
        options.onUnavailable("Speech recognition paused. Tap the mic again to restart practice.");
      }
    }
  };

  try {
    recognition.start();
  } catch {
    options.onUnavailable("Speech recognition could not start. Try closing other apps using the mic.");
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      recognition.stop();
    }
  };
}
