import type { Lesson, SpeakingPrompt } from "../data/lessons";
import type { LessonProgress } from "./progressStore";

export type SupportLevel = "guided" | "assisted" | "challenge";

export type SpeakingSupport = {
  level: SupportLevel;
  label: string;
  prompt: SpeakingPrompt;
  stepIndex: number;
  totalSteps: number;
  isFinalStep: boolean;
  isComplete: boolean;
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
  const totalSteps = lesson.prompts.length;
  const stepIndex = Math.min(learnerTurnCount, Math.max(totalSteps - 1, 0));
  const prompt = lesson.prompts[stepIndex] ?? lesson.prompts[0];
  const isFinalStep = stepIndex === totalSteps - 1;
  const isComplete = learnerTurnCount >= totalSteps;
  const stepState = { stepIndex, totalSteps, isFinalStep, isComplete };

  if (level === "challenge") {
    return {
      level,
      label: "Challenge",
      prompt,
      ...stepState,
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
      ...stepState,
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
    ...stepState,
    helperText: "Read the Spanish out loud, then try changing one word.",
    showModel: true,
    showMeaning: true,
    showPattern: true
  };
}
