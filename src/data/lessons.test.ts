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

  it("builds each lesson through multiple vocab-backed speaking steps", () => {
    expect(lessons.every((lesson) => lesson.prompts.length >= 5)).toBe(true);
    expect(lessons.flatMap((lesson) => lesson.prompts).every((prompt) => prompt.vocab.length > 0)).toBe(true);
  });
});
