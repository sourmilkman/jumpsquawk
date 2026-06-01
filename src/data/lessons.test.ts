import { describe, expect, it } from "vitest";
import { getLessonById, lessons } from "./lessons";

describe("lessons", () => {
  it("ships the everyday beginner v1 path", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual([
      "greetings",
      "food",
      "routine",
      "family",
      "hobbies"
    ]);
  });

  it("falls back to the first lesson for unknown ids", () => {
    expect(getLessonById("missing").id).toBe("greetings");
  });
});
