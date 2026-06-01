import type { Lesson, SpeakingPrompt } from "../data/lessons";
import type { LessonProgress } from "./progressStore";

export type SupportLevel = "guided" | "assisted" | "challenge";

export type SpeakingSupport = {
  level: SupportLevel;
  label: string;
  prompt: SpeakingPrompt;
  helperText: string;
  showModel: boolean;
  showMeaning: boolean;
  showPattern: boolean;
};

export function getSupportLevel(progress?: LessonProgress): SupportLevel {
  const completions = progress?.completions ?? 0;
  if (completions >= 4) return "challenge";
  if (completions >= 2) return "assisted";
  return "guided";
}

export function getSpeakingSupport(
  lesson: Lesson,
  progress: LessonProgress | undefined,
  learnerTurnCount: number
): SpeakingSupport {
  const level = getSupportLevel(progress);
  const prompt = lesson.prompts[learnerTurnCount % lesson.prompts.length] ?? lesson.prompts[0];

  if (level === "challenge") {
    return {
      level,
      label: "Challenge",
      prompt,
      helperText: "Try answering without the model phrase. Reveal it only if you get stuck.",
      showModel: false,
      showMeaning: false,
      showPattern: false
    };
  }

  if (level === "assisted") {
    return {
      level,
      label: "Assisted",
      prompt,
      helperText: "Use the cue first, then glance at the sentence pattern if needed.",
      showModel: false,
      showMeaning: true,
      showPattern: true
    };
  }

  return {
    level,
    label: "Guided",
    prompt,
    helperText: "Read the Spanish out loud, then try changing one word.",
    showModel: true,
    showMeaning: true,
    showPattern: true
  };
}
