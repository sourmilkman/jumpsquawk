import { describe, expect, it } from "vitest";
import { buildDemoReply } from "./realtimeClient";

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
