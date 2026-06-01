import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import { getSpeakingSupport, getSupportLevel } from "./scaffolding";

describe("scaffolding", () => {
  it("fades support as lesson completions increase", () => {
    expect(getSupportLevel(undefined)).toBe("guided");
    expect(getSupportLevel({ lessonId: "greetings", completions: 2, bestTurns: 3 })).toBe("assisted");
    expect(getSupportLevel({ lessonId: "greetings", completions: 4, bestTurns: 6 })).toBe("challenge");
  });

  it("cycles through guided speaking prompts by learner turn", () => {
    const first = getSpeakingSupport(lessons[0], undefined, 0);
    const second = getSpeakingSupport(lessons[0], undefined, 1);

    expect(first.prompt.say).toBe("Me llamo Tom.");
    expect(second.prompt.say).toBe("Mucho gusto.");
    expect(first.showModel).toBe(true);
  });
});
