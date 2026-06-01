import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import { buildSessionSummary, buildTutorInstructions } from "./sessionCoach";

describe("sessionCoach", () => {
  it("constrains the tutor to Spanish beginner speaking practice", () => {
    const instructions = buildTutorInstructions(lessons[0]);

    expect(instructions).toContain("Spanish-only");
    expect(instructions).toContain("mostly simple Spanish");
    expect(instructions).toContain(lessons[0].goal);
    expect(instructions).toContain(lessons[0].starter);
  });

  it("creates a lightweight end-of-session summary", () => {
    expect(buildSessionSummary(lessons[1], 4)).toContain("Cafe");
  });
});
