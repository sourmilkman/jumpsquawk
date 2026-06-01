import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUtteranceBuffer } from "./speechRecognition";

describe("createUtteranceBuffer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges cumulative Android recognition chunks into one utterance", () => {
    const onCommit = vi.fn();
    const onPreview = vi.fn();
    const buffer = createUtteranceBuffer({ delayMs: 1000, onCommit, onPreview });

    buffer.add("no");
    vi.advanceTimersByTime(300);
    buffer.add("no habla");
    vi.advanceTimersByTime(300);
    buffer.add("no habla espanol");
    vi.advanceTimersByTime(1000);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("no habla espanol");
    expect(onPreview).toHaveBeenLastCalledWith("");
  });

  it("suppresses exact repeat commits from recognition restarts", () => {
    const onCommit = vi.fn();
    const buffer = createUtteranceBuffer({ delayMs: 1000, onCommit });

    buffer.add("no habla");
    vi.advanceTimersByTime(1000);
    buffer.add("no habla");
    vi.advanceTimersByTime(1000);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("no habla");
  });
});
