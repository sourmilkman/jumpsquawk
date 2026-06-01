import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    ok: false,
    json: async () => ({ ok: false, realtimeReady: false })
  }))
);

afterEach(() => {
  Reflect.deleteProperty(window, "webkitSpeechRecognition");
});

describe("App", () => {
  it("renders the mobile-first practice surface", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Practice Spanish" })).toBeInTheDocument();
    expect(screen.getByText("Greetings and Introductions")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /practice/i }).length).toBeGreaterThan(0);
  });

  it("sends typed practice without requiring the mic first", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = await screen.findByLabelText("Type a practice reply");
    await user.type(input, "Me llamo Tom");
    await user.click(screen.getByRole("button", { name: "Send typed reply" }));

    expect(await screen.findByText("Me llamo Tom")).toBeInTheDocument();
    expect(screen.getAllByText(/Typed practice started/i).length).toBeGreaterThan(0);
  });

  it("starts browser speech recognition without pre-opening getUserMedia", async () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia }
    });

    const start = vi.fn(function start(this: { onstart?: () => void }) {
      this.onstart?.();
    });
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult = null;
      onerror = null;
      onend = null;
      onstart: (() => void) | null = null;
      onaudiostart = null;
      onspeechstart = null;
      onspeechend = null;
      start = start;
      stop = vi.fn();
    }
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition
    });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByLabelText("Start microphone practice"));

    expect(getUserMedia).not.toHaveBeenCalled();
    expect((await screen.findAllByText(/Listening for Spanish now/i)).length).toBeGreaterThan(0);
  });
});
