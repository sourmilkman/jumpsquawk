import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import { getSpeakingSupport, getSupportLevel } from "./scaffolding";

describe("scaffolding", () => {
  it("fades support as lesson completions increase", () => {
    expect(getSupportLevel(undefined)).toBe("guided");
    expect(getSupportLevel({ lessonId: "greetings", completions: 2, bestTurns: 3 })).toBe("assisted");
    expect(getSupportLevel({ lessonId: "greetings", completions: 4, bestTurns: 6 })).toBe("challenge");
  });

  it("advances through guided speaking prompts without looping", () => {
    const first = getSpeakingSupport(lessons[0], undefined, 0);
    const second = getSpeakingSupport(lessons[0], undefined, 1);
    const final = getSpeakingSupport(lessons[0], undefined, 99);

    expect(first.prompt.say).toBe("Me llamo Tom.");
    expect(second.prompt.say).toBe("Mucho gusto.");
    expect(final.prompt.say).toBe("Como estas?");
    expect(final.stepIndex).toBe(4);
    expect(final.totalSteps).toBe(5);
    expect(final.isFinalStep).toBe(true);
    expect(final.isComplete).toBe(true);
    expect(first.showModel).toBe(true);
  });
});
