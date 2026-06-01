import type { Lesson } from "../data/lessons";

const fixedTranslations = new Map<string, string>([
  ["hola soy lucia como te llamas", "Hi, I am Lucia. What is your name?"],
  ["buenos dias que quieres tomar", "Good morning. What would you like to drink?"],
  ["como es un dia normal para ti", "What is a normal day like for you?"],
  ["cuentame un poco sobre tu familia o tus amigos", "Tell me a little about your family or your friends."],
  ["que te gusta hacer los fines de semana", "What do you like to do at the weekend?"],
  ["muy bien puedes decir un poco mas usa una frase corta", "Very good. Can you say a little more? Use a short phrase."],
  ["muy bien", "Very good."],
  ["puedes decir un poco mas", "Can you say a little more?"],
  ["usa una frase corta", "Use a short phrase."]
]);

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function translateTutorText(text: string, lesson: Lesson): string | undefined {
  const normalized = normalize(text);
  const exact = fixedTranslations.get(normalized);
  if (exact) return exact;

  const prompt = lesson.prompts.find((item) => normalized.includes(normalize(item.say)));
  if (prompt) return prompt.meaning;

  const phraseIndex = lesson.phrases.findIndex((phrase) => normalized.includes(normalize(phrase)));
  if (phraseIndex >= 0) {
    return lesson.prompts[phraseIndex]?.meaning;
  }

  if (normalized.includes("como te llamas")) return "What is your name?";
  if (normalized.includes("de donde eres")) return "Where are you from?";
  if (normalized.includes("que quieres")) return "What would you like?";
  if (normalized.includes("cuanto cuesta")) return "How much does it cost?";
  if (normalized.includes("y a ti")) return "And you?";

  return undefined;
}
