import { describe, expect, it } from "vitest";
import { isLikelyTutorEcho, normalizeSpeech } from "./speechFilters";

describe("speechFilters", () => {
  it("normalizes accents and spacing", () => {
    expect(normalizeSpeech(" Mucho gusto, Lucía! ")).toBe("mucho gusto lucia");
  });

  it("detects tutor audio transcribed as learner speech", () => {
    expect(
      isLikelyTutorEcho("mucho gusto puedes decir mucho gusto Lucia", [
        "Mucho gusto. Puedes decir: Mucho gusto, Lucia."
      ])
    ).toBe(true);
  });

  it("allows a genuine learner answer", () => {
    expect(isLikelyTutorEcho("me llamo Tom", ["Hola, soy Lucia. Como te llamas?"])).toBe(false);
  });
});
