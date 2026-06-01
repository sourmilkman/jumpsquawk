export function normalizeSpeech(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return normalizeSpeech(text)
    .split(" ")
    .filter((word) => word.length > 2);
}

export function isLikelyTutorEcho(candidate: string, recentTutorLines: string[]): boolean {
  const normalizedCandidate = normalizeSpeech(candidate);
  if (!normalizedCandidate) return false;

  const candidateWords = words(normalizedCandidate);
  if (candidateWords.length < 2) return false;

  return recentTutorLines.some((line) => {
    const normalizedLine = normalizeSpeech(line);
    if (!normalizedLine) return false;
    if (normalizedLine === normalizedCandidate) return true;
    if (normalizedLine.includes(normalizedCandidate) && normalizedCandidate.length > 10) return true;
    if (normalizedCandidate.includes(normalizedLine) && normalizedLine.length > 10) return true;

    const tutorWords = new Set(words(normalizedLine));
    const overlap = candidateWords.filter((word) => tutorWords.has(word)).length;
    return overlap >= 3 && overlap / candidateWords.length >= 0.82;
  });
}
