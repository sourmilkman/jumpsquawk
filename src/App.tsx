import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Home,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Settings,
  Signal,
  Sparkles,
  Square,
  Trophy,
  WifiOff
} from "lucide-react";
import { getLessonById, lessons, type Lesson } from "./data/lessons";
import { getGatewayHealth, type HealthState } from "./lib/health";
import { ensureMicrophoneAccess } from "./lib/microphone";
import {
  loadProgress,
  recordSession,
  updateSettings,
  type ProgressState
} from "./lib/progressStore";
import {
  startDemoSession,
  startRealtimeSession,
  type RealtimeVoice,
  type RealtimeSession,
  type RealtimeStatus,
  type TranscriptMessage
} from "./lib/realtimeClient";
import { buildSessionSummary, buildTutorInstructions } from "./lib/sessionCoach";
import { startSpeechRecognition, supportsSpeechRecognition, type SpeechRecognitionHandle } from "./lib/speechRecognition";
import { clearAppCacheAndReload } from "./lib/appUpdate";
import { APP_VERSION } from "./lib/version";
import { getSpeakingSupport, type SpeakingSupport } from "./lib/scaffolding";

type View = "practice" | "lessons" | "review" | "progress" | "settings";

const navItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "practice", label: "Practice", icon: Home },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "review", label: "Review", icon: RotateCcw },
  { id: "progress", label: "Progress", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings }
];

const statusLabel: Record<RealtimeStatus, string> = {
  idle: "Ready",
  "requesting-mic": "Asking for mic",
  connecting: "Connecting",
  listening: "Listening",
  speaking: "Tutor speaking",
  ended: "Session saved",
  error: "Needs attention"
};

const voiceOptions: Array<{ value: RealtimeVoice; label: string }> = [
  { value: "coral", label: "Coral - warm feminine" },
  { value: "shimmer", label: "Shimmer - bright feminine" },
  { value: "sage", label: "Sage - calm" },
  { value: "verse", label: "Verse - expressive" },
  { value: "marin", label: "Marin - natural" },
  { value: "ballad", label: "Ballad - soft" },
  { value: "alloy", label: "Alloy - balanced" },
  { value: "ash", label: "Ash - low" },
  { value: "echo", label: "Echo - clear" }
];

function sameOriginGateway(): string {
  return window.location.origin.includes("localhost") ? "" : "";
}

export function App() {
  const [view, setView] = useState<View>("practice");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [lessonId, setLessonId] = useState(lessons[0].id);
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [typedReply, setTypedReply] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState<HealthState | null>(null);
  const [micNote, setMicNote] = useState("Microphone permission has not been requested yet.");
  const [micLevel, setMicLevel] = useState(0);
  const [interimSpeech, setInterimSpeech] = useState("");
  const sessionRef = useRef<RealtimeSession | null>(null);
  const demoMicRef = useRef<MediaStream | null>(null);
  const speechRef = useRef<SpeechRecognitionHandle | null>(null);

  const lesson = useMemo(() => getLessonById(lessonId), [lessonId]);
  const turns = messages.filter((message) => message.role !== "system").length;
  const learnerTurns = messages.filter((message) => message.role === "learner").length;
  const settings = progress?.settings;
  const gatewayUrl = settings?.gatewayUrl ?? sameOriginGateway();
  const useDemo = settings?.demoMode || !health?.realtimeReady;
  const speakingSupport = useMemo(
    () => getSpeakingSupport(lesson, progress?.lessons[lesson.id], learnerTurns),
    [lesson, learnerTurns, progress?.lessons]
  );

  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);

  useEffect(() => {
    if (!settings) return;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const theme = settings.theme === "system" ? (prefersDark ? "dark" : "light") : settings.theme;
    document.documentElement.dataset.theme = theme;
  }, [settings]);

  useEffect(() => {
    const base = gatewayUrl.trim();
    getGatewayHealth(base)
      .then((nextHealth) => {
        setHealth(nextHealth);
        setError("");
      })
      .catch(() => {
        setHealth({ ok: false, realtimeReady: false });
      });
  }, [gatewayUrl]);

  async function patchSettings(next: Partial<ProgressState["settings"]>) {
    if (!progress) return;
    const nextProgress = await updateSettings(progress, next);
    setProgress(nextProgress);
  }

  function resetSessionMessages() {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "system",
        text: `${lesson.setting} Goal: ${lesson.goal}`,
        at: new Date().toISOString()
      }
    ]);
  }

  function makeHandlers() {
    return {
      onStatus: setStatus,
      onMessage: (message: TranscriptMessage) =>
        setMessages((current) => {
          const last = current[current.length - 1];
          if (last?.role === message.role && last.text === message.text) return current;
          return [...current, message].slice(-18);
        }),
      onError: (message: string) => {
        setError(message);
        setStatus("error");
      }
    };
  }

  async function startSession() {
    if (!progress) return;
    setError("");
    resetSessionMessages();
    const handlers = makeHandlers();

    try {
      sessionRef.current?.stop();
      speechRef.current?.stop();
      speechRef.current = null;
      demoMicRef.current?.getTracks().forEach((track) => track.stop());
      demoMicRef.current = null;
      setInterimSpeech("");

      sessionRef.current = useDemo
        ? await startDemoPractice({
            starter: lesson.starter,
            handlers,
            setMicNote,
            setMicLevel,
            setInterimSpeech,
            micRef: demoMicRef,
            speechRef
          })
        : await startRealtimeSession(
            buildTutorInstructions(lesson, speakingSupport.level),
            gatewayUrl,
            progress.settings.voice,
            handlers
          );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start practice.");
      setStatus("error");
    }
  }

  async function endSession() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    speechRef.current?.stop();
    speechRef.current = null;
    demoMicRef.current?.getTracks().forEach((track) => track.stop());
    demoMicRef.current = null;
    setInterimSpeech("");
    setMicLevel(0);

    if (!progress) return;
    const summary = buildSessionSummary(lesson, Math.max(turns, 1));
    const nextProgress = await recordSession(progress, {
      id: crypto.randomUUID(),
      lessonId: lesson.id,
      createdAt: new Date().toISOString(),
      turns: Math.max(turns, 1),
      summary,
      mode: useDemo ? "demo" : "live"
    });
    setProgress(nextProgress);
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "system",
        text: summary,
        at: new Date().toISOString()
      }
    ]);
    setStatus("ended");
  }

  async function sendTypedReply() {
    if (!progress) return;
    const text = typedReply.trim();
    if (!text) return;
    setTypedReply("");
    setError("");

    if (!sessionRef.current) {
      resetSessionMessages();
      const handlers = makeHandlers();

      if (useDemo) {
        sessionRef.current = startDemoSession(lesson.starter, handlers);
        setMicNote("Typed practice started. Tap the red mic if you also want speech input.");
      } else {
        try {
          sessionRef.current = await startRealtimeSession(
            buildTutorInstructions(lesson, speakingSupport.level),
            gatewayUrl,
            progress.settings.voice,
            handlers
          );
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Could not start live text practice.");
          setStatus("error");
          return;
        }
      }
    }

    sessionRef.current.sendText(text);
  }

  if (!progress) {
    return <div className="boot">Loading Jumpsquawk...</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">JS</div>
          <div>
            <strong>Jumpsquawk</strong>
            <span>Spanish speaking</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={view === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="local-chip">
          {health?.realtimeReady ? <Signal size={16} /> : <WifiOff size={16} />}
          <span>{health?.realtimeReady ? "Live voice ready" : "Demo mode ready"}</span>
        </div>
        <span className="version-chip">v{APP_VERSION}</span>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div>
            <p>{useDemo ? "Demo practice" : "Live Realtime practice"} - v{APP_VERSION}</p>
            <h1>{viewTitle(view)}</h1>
          </div>
          <div className="top-stats">
            <span>
              <Flame size={17} /> {progress.streak} day
            </span>
            <span>
              <CheckCircle2 size={17} /> {Object.keys(progress.lessons).length}/{lessons.length}
            </span>
          </div>
        </header>

        {view === "practice" && (
          <PracticeView
            error={error}
            lesson={lesson}
            messages={messages}
            onEnd={endSession}
            onLessonChange={setLessonId}
            onSend={sendTypedReply}
            onStart={startSession}
            progress={progress}
            setTypedReply={setTypedReply}
            status={status}
            typedReply={typedReply}
            useDemo={Boolean(useDemo)}
            micNote={micNote}
            micLevel={micLevel}
            interimSpeech={interimSpeech}
            support={speakingSupport}
          />
        )}
        {view === "lessons" && (
          <LessonGrid
            activeLesson={lesson}
            onChoose={(id) => {
              setLessonId(id);
              setView("practice");
            }}
            progress={progress}
          />
        )}
        {view === "review" && <ReviewView progress={progress} />}
        {view === "progress" && <ProgressView progress={progress} />}
        {view === "settings" && (
          <SettingsView
            gatewayUrl={gatewayUrl}
            health={health}
            onSettings={patchSettings}
            progress={progress}
            voiceOptions={voiceOptions}
            version={APP_VERSION}
            onUpdateApp={clearAppCacheAndReload}
          />
        )}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={view === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

async function startDemoPractice(options: {
  starter: string;
  handlers: Parameters<typeof startDemoSession>[1];
  setMicNote: (message: string) => void;
  setMicLevel: (level: number) => void;
  setInterimSpeech: (text: string) => void;
  micRef: MutableRefObject<MediaStream | null>;
  speechRef: MutableRefObject<SpeechRecognitionHandle | null>;
}): Promise<RealtimeSession> {
  const { starter, handlers, setMicNote, setMicLevel, setInterimSpeech, micRef, speechRef } = options;
  handlers.onStatus("requesting-mic");
  const session = startDemoSession(starter, handlers);
  const speechSupported = supportsSpeechRecognition();

  if (!speechSupported) {
    const check = await ensureMicrophoneAccess();
    micRef.current = check.stream;
    setMicLevel(check.level);
    setMicNote(
      "Microphone permission granted, but this browser cannot transcribe demo speech. Use live mode or type a reply."
    );
    return {
      stop: () => {
        micRef.current?.getTracks().forEach((track) => track.stop());
        micRef.current = null;
        session.stop();
      },
      sendText: session.sendText
    };
  }

  setMicLevel(0.2);
  setMicNote(
    "Starting speech recognition. If Android asks for the microphone, choose Allow."
  );

  speechRef.current = startSpeechRecognition({
    onFinal: (text) => {
      setInterimSpeech("");
      session.sendText(text);
    },
    onInterim: setInterimSpeech,
    onUnavailable: (message) => {
      setMicLevel(0);
      setMicNote(message);
    },
    onListening: () => {
      setMicLevel(0.35);
      setMicNote("Listening for Spanish now. Speak after the tutor prompt.");
    },
    onAudioStart: () => {
      setMicLevel(0.55);
      setMicNote("Microphone is active. Start speaking in Spanish.");
    },
    onSpeechStart: () => {
      setMicLevel(0.85);
      setMicNote("I hear speech. Keep going until the phrase appears.");
    },
    onSpeechEnd: () => {
      setMicLevel(0.35);
      setMicNote("Processing what you said...");
    }
  });

  return {
    stop: () => {
      speechRef.current?.stop();
      speechRef.current = null;
      session.stop();
    },
    sendText: session.sendText
  };
}

function PracticeView(props: {
  error: string;
  lesson: Lesson;
  messages: TranscriptMessage[];
  onEnd: () => void;
  onLessonChange: (id: string) => void;
  onSend: () => void;
  onStart: () => void;
  progress: ProgressState;
  setTypedReply: (value: string) => void;
  status: RealtimeStatus;
  typedReply: string;
  useDemo: boolean;
  micNote: string;
  micLevel: number;
  interimSpeech: string;
  support: SpeakingSupport;
}) {
  const active = !["idle", "ended", "error"].includes(props.status);

  return (
    <section className="practice-layout">
      <div className="conversation-panel">
        <div className="lesson-switcher">
          {lessons.map((item) => (
            <button
              className={props.lesson.id === item.id ? "selected" : ""}
              key={item.id}
              onClick={() => props.onLessonChange(item.id)}
              type="button"
            >
              {item.shortTitle}
            </button>
          ))}
        </div>

        <div className="coach-card">
          <div className="coach-orb">
            <Sparkles size={32} />
          </div>
          <div>
            <p>{props.lesson.level} conversation</p>
            <h2>{props.lesson.title}</h2>
            <span>{props.lesson.minutes} min - {statusLabel[props.status]}</span>
          </div>
        </div>

        <div className={`support-card ${props.support.level}`}>
          <div>
            <span>{props.support.label} prompt</span>
            <h3>{props.support.prompt.cue}</h3>
            <p>{props.support.helperText}</p>
          </div>
          {props.support.showModel && (
            <button
              className="model-phrase"
              onClick={() => props.setTypedReply(props.support.prompt.say)}
              type="button"
            >
              {props.support.prompt.say}
            </button>
          )}
          <div className="support-details">
            {props.support.showMeaning && <span>{props.support.prompt.meaning}</span>}
            {props.support.showPattern && <span>{props.support.prompt.pattern}</span>}
            {!props.support.showModel && (
              <button onClick={() => props.setTypedReply(props.support.prompt.say)} type="button">
                Use phrase
              </button>
            )}
          </div>
        </div>

        <div className="transcript" aria-live="polite">
          {props.messages.length === 0 ? (
            <div className="empty-state">
              <Mic size={30} />
              <h3>Start with a short answer out loud.</h3>
              <p>{props.lesson.starter}</p>
              {props.interimSpeech && <p className="interim-speech">{props.interimSpeech}</p>}
            </div>
          ) : (
            props.messages.map((message) => (
              <article className={`bubble ${message.role}`} key={message.id}>
                <span>{message.role === "tutor" ? "Tutor" : message.role === "learner" ? "You" : "Note"}</span>
                <p>{message.text}</p>
              </article>
            ))
          )}
        </div>

        {props.error && <div className="error-line">{props.error}</div>}
        <div className="mic-note">
          <span>{props.micNote}</span>
          <span className="mic-meter" aria-label="Microphone activity">
            <span style={{ width: `${Math.max(8, Math.round(props.micLevel * 100))}%` }} />
          </span>
          {props.interimSpeech && <strong>Hearing: {props.interimSpeech}</strong>}
        </div>

        <div className="practice-controls">
          <button
            aria-label={active ? "End practice session" : "Start microphone practice"}
            className="mic-button"
            onClick={active ? props.onEnd : props.onStart}
            type="button"
          >
            {active ? <Square size={30} /> : props.status === "error" ? <MicOff size={30} /> : <Mic size={34} />}
          </button>
          <div className="typed-reply">
            <input
              aria-label="Type a practice reply"
              onChange={(event) => props.setTypedReply(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") props.onSend();
              }}
              placeholder="Type instead..."
              value={props.typedReply}
            />
            <button aria-label="Send typed reply" onClick={props.onSend} type="button">
              <Play size={18} />
            </button>
          </div>
        </div>
      </div>

      <aside className="lesson-panel">
        <div className="panel-section">
          <p>Goal</p>
          <h2>{props.lesson.goal}</h2>
        </div>
        <div className="panel-section">
          <p>Current support</p>
          <h2>{props.support.label}</h2>
          <ul>
            <li>{props.support.prompt.cue}</li>
            <li>{props.support.prompt.meaning}</li>
          </ul>
        </div>
        <div className="panel-section">
          <p>Phrase bank</p>
          <div className="phrase-list">
            {props.lesson.phrases.map((phrase) => (
              <button key={phrase} onClick={() => props.setTypedReply(phrase)} type="button">
                {phrase}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-section">
          <p>Session notes</p>
          <ul>
            {props.lesson.hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          <li>{props.useDemo ? "Demo replies are scripted." : "Live audio uses your configured gateway."}</li>
            <li>{props.micNote}</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}

function LessonGrid({
  activeLesson,
  onChoose,
  progress
}: {
  activeLesson: Lesson;
  onChoose: (id: string) => void;
  progress: ProgressState;
}) {
  return (
    <section className="content-grid">
      {lessons.map((lesson) => {
        const completed = progress.lessons[lesson.id]?.completions ?? 0;
        return (
          <button
            className={activeLesson.id === lesson.id ? "lesson-card active" : "lesson-card"}
            key={lesson.id}
            onClick={() => onChoose(lesson.id)}
            type="button"
          >
            <span>{lesson.level} - {lesson.minutes} min</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.goal}</p>
            <strong>{completed} completions</strong>
          </button>
        );
      })}
    </section>
  );
}

function ReviewView({ progress }: { progress: ProgressState }) {
  const recent = progress.sessions.slice(0, 6);
  return (
    <section className="plain-panel">
      <h2>Review queue</h2>
      {recent.length === 0 ? (
        <p>Finish one practice session and your review notes will appear here.</p>
      ) : (
        recent.map((session) => (
          <article className="history-row" key={session.id}>
            <strong>{getLessonById(session.lessonId).shortTitle}</strong>
            <p>{session.summary}</p>
            <span>{session.mode} - {session.turns} turns</span>
          </article>
        ))
      )}
    </section>
  );
}

function ProgressView({ progress }: { progress: ProgressState }) {
  return (
    <section className="plain-panel">
      <h2>Your Spanish practice</h2>
      <div className="metrics">
        <div>
          <strong>{progress.streak}</strong>
          <span>day streak</span>
        </div>
        <div>
          <strong>{progress.sessions.length}</strong>
          <span>sessions saved</span>
        </div>
        <div>
          <strong>{Object.keys(progress.lessons).length}</strong>
          <span>lessons touched</span>
        </div>
      </div>
      <LessonGrid activeLesson={lessons[0]} onChoose={() => undefined} progress={progress} />
    </section>
  );
}

function SettingsView({
  gatewayUrl,
  health,
  onSettings,
  progress,
  voiceOptions,
  version,
  onUpdateApp
}: {
  gatewayUrl: string;
  health: HealthState | null;
  onSettings: (settings: Partial<ProgressState["settings"]>) => void;
  progress: ProgressState;
  voiceOptions: Array<{ value: RealtimeVoice; label: string }>;
  version: string;
  onUpdateApp: () => void;
}) {
  return (
    <section className="plain-panel settings-panel">
      <h2>Local settings</h2>
      <div className="version-row">
        <span>Version</span>
        <strong>v{version}</strong>
      </div>
      <button className="update-button" onClick={onUpdateApp} type="button">
        Update app
      </button>
      <label className="switch-row">
        <span>
          <strong>Demo mode</strong>
          <small>Use scripted Spanish practice without the OpenAI gateway.</small>
        </span>
        <input
          checked={progress.settings.demoMode}
          onChange={(event) => onSettings({ demoMode: event.target.checked })}
          type="checkbox"
        />
      </label>
      <label>
        <span>Theme</span>
        <select
          onChange={(event) =>
            onSettings({ theme: event.target.value as ProgressState["settings"]["theme"] })
          }
          value={progress.settings.theme}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        <span>Tutor voice</span>
        <select
          onChange={(event) => onSettings({ voice: event.target.value as RealtimeVoice })}
          value={progress.settings.voice}
        >
          {voiceOptions.map((voice) => (
            <option key={voice.value} value={voice.value}>
              {voice.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Realtime gateway URL</span>
        <input
          onBlur={(event) => onSettings({ gatewayUrl: event.target.value.trim() })}
          placeholder="Same origin, or https://your-private-gateway.example"
          defaultValue={gatewayUrl}
        />
      </label>
      <p className="settings-note">
        GitHub Pages can install the PWA and keep progress on your phone. Live voice still needs a private gateway
        with `OPENAI_API_KEY`; the key is never bundled into the static app.
      </p>
      <p className="settings-note">
        Live conversations use the OpenAI speech-to-speech Realtime model. The tutor voice is AI-generated, not a
        human recording.
      </p>
      <div className="gateway-status">
        {health?.realtimeReady ? <Signal size={18} /> : <WifiOff size={18} />}
        <span>{health?.realtimeReady ? `Ready: ${health.model}` : "Gateway unavailable; demo mode works."}</span>
      </div>
    </section>
  );
}

function viewTitle(view: View): string {
  switch (view) {
    case "lessons":
      return "Lessons";
    case "review":
      return "Review";
    case "progress":
      return "Progress";
    case "settings":
      return "Settings";
    default:
      return "Practice Spanish";
  }
}
