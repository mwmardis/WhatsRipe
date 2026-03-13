const QUALIFIERS = new Set([
  "fresh", "organic", "large", "small", "whole", "raw", "dried",
]);

export function normalizeName(name: string): string {
  let result = name.toLowerCase().trim();

  // Remove qualifiers
  result = result
    .split(/\s+/)
    .filter((word) => !QUALIFIERS.has(word))
    .join(" ");

  // Strip trailing "s" for basic plurals (but not "ss" like "grass")
  result = result
    .split(/\s+/)
    .map((word) => (word.length > 2 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word))
    .join(" ");

  // Also handle "oes" → "o" (tomatoes → tomato)
  result = result
    .split(/\s+/)
    .map((word) => (word.endsWith("oe") && word.length > 3 ? word.slice(0, -1) : word))
    .join(" ");

  // Collapse multiple spaces
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

function tokenize(s: string): Set<string> {
  return new Set(s.split(/\s+/).filter(Boolean));
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface MappingCandidate {
  genericName: string;
  id: string;
}

export interface MatchResult {
  id: string;
  score: number;
}

export function findBestMatch(
  itemName: string,
  mappings: MappingCandidate[],
  threshold = 0.7
): MatchResult | null {
  if (mappings.length === 0) return null;

  const normalizedItem = normalizeName(itemName);
  let bestMatch: MatchResult | null = null;

  for (const mapping of mappings) {
    const normalizedMapping = normalizeName(mapping.genericName);
    const score = jaccardSimilarity(normalizedItem, normalizedMapping);

    if (score >= threshold && (bestMatch === null || score > bestMatch.score)) {
      bestMatch = { id: mapping.id, score };
    }
  }

  return bestMatch;
}
