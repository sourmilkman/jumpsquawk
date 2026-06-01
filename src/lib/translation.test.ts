import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import { translateTutorText } from "./translation";

describe("translateTutorText", () => {
  it("translates starter tutor lines", () => {
    expect(translateTutorText("Hola, soy Lucia. Como te llamas?", lessons[0])).toBe(
      "Hi, I am Lucia. What is your name?"
    );
  });

  it("translates the scripted demo coaching response", () => {
    expect(
      translateTutorText("Muy bien. Puedes decir un poco mas? Usa una frase corta.", lessons[0])
    ).toBe("Very good. Can you say a little more? Use a short phrase.");
  });
});
