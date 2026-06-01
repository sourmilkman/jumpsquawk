import type { RealtimeVoice } from "./realtimeClient";

const femaleVoiceNamePattern =
  /female|mujer|helena|helena|elvira|lucia|lucía|laura|lorena|maria|maría|monica|mónica|paulina|sabina|soledad|paloma|carmen|conchita|google español/i;
const maleVoiceNamePattern = /male|hombre|pablo|diego|jorge|carlos|miguel|juan|pedro|raul|raúl|enrique|google español de españa/i;

const voiceProfiles: Record<RealtimeVoice, { pitch: number; rate: number; preferFemale: boolean }> = {
  coral: { pitch: 1.18, rate: 0.86, preferFemale: true },
  shimmer: { pitch: 1.22, rate: 0.88, preferFemale: true },
  verse: { pitch: 1.1, rate: 0.9, preferFemale: true },
  ballad: { pitch: 1.14, rate: 0.82, preferFemale: true },
  marin: { pitch: 1.04, rate: 0.88, preferFemale: true },
  sage: { pitch: 1.02, rate: 0.86, preferFemale: false },
  alloy: { pitch: 1, rate: 0.88, preferFemale: false },
  ash: { pitch: 0.9, rate: 0.86, preferFemale: false },
  echo: { pitch: 0.96, rate: 0.88, preferFemale: false }
};

function chooseSpanishVoice(voices: SpeechSynthesisVoice[], profile: { preferFemale: boolean }) {
  const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("es"));
  const likelyFemale = spanishVoices.filter(
    (voice) => femaleVoiceNamePattern.test(voice.name) && !maleVoiceNamePattern.test(voice.name)
  );
  const nonMale = spanishVoices.filter((voice) => !maleVoiceNamePattern.test(voice.name));

  if (profile.preferFemale) {
    return likelyFemale[0] ?? nonMale[0] ?? spanishVoices[0];
  }

  return nonMale[0] ?? spanishVoices[0];
}

export function speakSpanish(text: string, enabled = true, voice: RealtimeVoice = "coral"): void {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const profile = voiceProfiles[voice] ?? voiceProfiles.coral;
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = chooseSpanishVoice(voices, profile);

  if (spanishVoice) {
    utterance.voice = spanishVoice;
    utterance.lang = spanishVoice.lang;
  } else {
    utterance.lang = "es-ES";
  }

  utterance.rate = profile.rate;
  utterance.pitch = profile.pitch;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpanishSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
