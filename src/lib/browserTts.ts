export function speakSpanish(text: string, enabled = true): void {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice =
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es") && /female|mujer|helena|monica|paulina|lucia|sabina/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));

  if (spanishVoice) {
    utterance.voice = spanishVoice;
    utterance.lang = spanishVoice.lang;
  } else {
    utterance.lang = "es-ES";
  }

  utterance.rate = 0.88;
  utterance.pitch = 1.08;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpanishSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
