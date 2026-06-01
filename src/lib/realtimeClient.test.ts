import { describe, expect, it } from "vitest";
import { buildDemoReply, splitTutorTranslation } from "./realtimeClient";

describe("buildDemoReply", () => {
  it("acknowledges mucho gusto and a follow-up question", () => {
    expect(buildDemoReply("bien mucho gusto Lucia como estas")).toBe(
      "Mucho gusto tambien. Estoy bien, gracias. Y tu, como estas?"
    );
  });

  it("does not always fall back to the generic prompt after a name", () => {
    expect(buildDemoReply("Hola, me llamo Tom")).toBe(
      "Mucho gusto. Puedes decir: Mucho gusto, Lucia."
    );
  });
});

describe("splitTutorTranslation", () => {
  it("splits beginner English glosses out of tutor transcript text", () => {
    expect(splitTutorTranslation("Hola, soy Lucia. English: Hi, I am Lucia.")).toEqual({
      text: "Hola, soy Lucia.",
      translation: "Hi, I am Lucia."
    });
  });

  it("leaves ordinary tutor text alone", () => {
    expect(splitTutorTranslation("Como te llamas?")).toEqual({ text: "Como te llamas?" });
  });
});
