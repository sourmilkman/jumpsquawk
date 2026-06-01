export type SpeechRecognitionHandle = {
  stop: () => void;
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

export function startSpeechRecognition(options: {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onUnavailable: (message: string) => void;
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

  recognition.onresult = (event) => {
    let interim = "";

    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript.trim();
      if (!transcript) continue;

      if (result.isFinal) {
        options.onFinal(transcript);
      } else {
        interim = transcript;
      }
    }

    options.onInterim(interim);
  };

  recognition.onerror = () => {
    options.onUnavailable("Speech recognition stopped. Check Android microphone/browser permissions.");
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
