export type LessonProgress = {
  lessonId: string;
  completions: number;
  lastPracticedAt?: string;
  bestTurns: number;
};

export type SessionSummary = {
  id: string;
  lessonId: string;
  createdAt: string;
  turns: number;
  summary: string;
  mode: "demo" | "live";
};

export type AppSettings = {
  demoMode: boolean;
  audioOutput: boolean;
  gatewayUrl: string;
  theme: "system" | "light" | "dark";
  voice: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | "marin";
};

export type ProgressState = {
  streak: number;
  lastPracticeDate?: string;
  lessons: Record<string, LessonProgress>;
  sessions: SessionSummary[];
  settings: AppSettings;
};

const DB_NAME = "jumpsquawk-local";
const DB_VERSION = 1;
const STATE_KEY = "progress";

const defaultState: ProgressState = {
  streak: 0,
  lessons: {},
  sessions: [],
  settings: {
    demoMode: false,
    audioOutput: true,
    gatewayUrl: "",
    theme: "system",
    voice: "coral"
  }
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("state")) {
        db.createObjectStore("state");
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("state", mode);
    const store = transaction.objectStore("state");
    const request = action(store);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadProgress(): Promise<ProgressState> {
  try {
    const stored = await withStore<ProgressState | undefined>("readonly", (store) =>
      store.get(STATE_KEY)
    );
    return stored
      ? {
          ...defaultState,
          ...stored,
          settings: { ...defaultState.settings, ...stored.settings }
        }
      : defaultState;
  } catch {
    return defaultState;
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await withStore<IDBValidKey>("readwrite", (store) => store.put(state, STATE_KEY));
}

export async function recordSession(
  state: ProgressState,
  session: SessionSummary
): Promise<ProgressState> {
  const today = session.createdAt.slice(0, 10);
  const practicedYesterday =
    state.lastPracticeDate &&
    Date.parse(today) - Date.parse(state.lastPracticeDate) <= 1000 * 60 * 60 * 24 * 1.5 &&
    state.lastPracticeDate !== today;

  const current = state.lessons[session.lessonId] ?? {
    lessonId: session.lessonId,
    completions: 0,
    bestTurns: 0
  };

  const nextState: ProgressState = {
    ...state,
    streak:
      state.lastPracticeDate === today
        ? state.streak
        : practicedYesterday
          ? state.streak + 1
          : 1,
    lastPracticeDate: today,
    lessons: {
      ...state.lessons,
      [session.lessonId]: {
        ...current,
        completions: current.completions + 1,
        lastPracticedAt: session.createdAt,
        bestTurns: Math.max(current.bestTurns, session.turns)
      }
    },
    sessions: [session, ...state.sessions].slice(0, 20)
  };

  await saveProgress(nextState);
  return nextState;
}

export async function updateSettings(
  state: ProgressState,
  settings: Partial<AppSettings>
): Promise<ProgressState> {
  const nextState = {
    ...state,
    settings: { ...state.settings, ...settings }
  };
  await saveProgress(nextState);
  return nextState;
}
