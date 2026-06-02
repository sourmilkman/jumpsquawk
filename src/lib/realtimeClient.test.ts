import { describe, expect, it } from "vitest";
import {
  buildDemoReply,
  splitTutorTranslation,
  transcriptMessageFromPayload
} from "./realtimeClient";

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

describe("transcriptMessageFromPayload", () => {
  it("treats input audio transcription events as learner dialogue", () => {
    const message = transcriptMessageFromPayload({
      type: "conversation.item.input_audio_transcription.completed",
      transcript: "Me llamo Tom"
    });

    expect(message?.role).toBe("learner");
    expect(message?.text).toBe("Me llamo Tom");
  });

  it("treats tutor output audio transcript events as tutor dialogue", () => {
    const message = transcriptMessageFromPayload({
      type: "response.output_audio_transcript.done",
      transcript: "Hola. Translation: Hi."
    });

    expect(message?.role).toBe("tutor");
    expect(message?.text).toBe("Hola.");
    expect(message?.translation).toBe("Hi.");
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

  it("supports translation-only text output", () => {
    expect(splitTutorTranslation("Translation: What is your name?")).toEqual({
      text: "Translation: What is your name?",
      translation: "What is your name?"
    });
  });
});
