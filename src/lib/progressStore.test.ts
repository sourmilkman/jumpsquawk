import { beforeEach, describe, expect, it } from "vitest";
import { loadProgress, recordSession, updateSettings } from "./progressStore";

describe("progressStore", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("jumpsquawk-local");
  });

  it("loads default local progress", async () => {
    const progress = await loadProgress();

    expect(progress.streak).toBe(0);
    expect(progress.settings.demoMode).toBe(false);
    expect(progress.settings.gatewayUrl).toBe("");
  });

  it("records a session and persists settings", async () => {
    const progress = await loadProgress();
    const afterSession = await recordSession(progress, {
      id: "session-1",
      lessonId: "greetings",
      createdAt: "2026-06-01T12:00:00.000Z",
      turns: 5,
      summary: "Nice practice.",
      mode: "demo"
    });
    const afterSettings = await updateSettings(afterSession, {
      demoMode: true,
      gatewayUrl: "https://voice.example.test"
    });

    expect(afterSettings.lessons.greetings.completions).toBe(1);
    expect(afterSettings.lessons.greetings.bestTurns).toBe(5);
    expect(afterSettings.settings.demoMode).toBe(true);
    expect(afterSettings.settings.gatewayUrl).toBe("https://voice.example.test");
  });
});
