/**
 * EmpSphere Smart Fuzzy Search Utility with Typo-Tolerance
 * 
 * Features:
 * - Substring matching (fast path)
 * - Levenshtein distance for typo tolerance (handles swapped/missing letters like "taks" -> "tasks")
 * - Subsequence matching with prefix boosting
 */

export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Checks if query matches target with fuzzy tolerance.
 * Returns { matches: boolean, score: number } where higher score is better.
 */
export function fuzzyMatch(
  query: string,
  target: string
): { matches: boolean; score: number } {
  if (!query || !target) return { matches: false, score: 0 };

  const q = query.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  // 1. Exact match
  if (t === q) {
    return { matches: true, score: 100 };
  }

  // 2. Starts with query (prefix match)
  if (t.startsWith(q)) {
    return { matches: true, score: 90 };
  }

  // 3. Substring match
  const substringIndex = t.indexOf(q);
  if (substringIndex !== -1) {
    return { matches: true, score: 80 - substringIndex };
  }

  // 4. Word-level prefix match (e.g. "set" in "Workspace Settings")
  const words = t.split(/[\s_-]+/);
  for (const word of words) {
    if (word.startsWith(q)) {
      return { matches: true, score: 75 };
    }
  }

  // 5. Typo tolerance via Levenshtein distance on words
  // Only evaluate for queries with length >= 3 to avoid noise
  if (q.length >= 3) {
    for (const word of words) {
      const maxAllowedDistance = q.length <= 4 ? 1 : 2;
      // Compare word or word prefix
      const wordSlice = word.slice(0, Math.max(q.length + 1, 4));
      const dist = levenshteinDistance(q, wordSlice);
      if (dist <= maxAllowedDistance) {
        return { matches: true, score: 60 - dist * 10 };
      }
    }

    // Compare whole target if short
    if (t.length <= 15) {
      const dist = levenshteinDistance(q, t);
      if (dist <= 2) {
        return { matches: true, score: 55 - dist * 10 };
      }
    }
  }

  // 6. Subsequence matching (characters in order, e.g. "tsk" -> "task")
  let qIdx = 0;
  let matchesInOrder = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
      matchesInOrder++;
    }
  }

  if (matchesInOrder === q.length && q.length >= 3) {
    return { matches: true, score: 40 };
  }

  return { matches: false, score: 0 };
}

/**
 * Filter an array of items using fuzzy matching across multiple candidate fields.
 */
export function filterFuzzy<T>(
  items: T[],
  query: string,
  getFieldStrings: (item: T) => (string | undefined | null)[]
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  const scored: { item: T; bestScore: number }[] = [];

  for (const item of items) {
    const fields = getFieldStrings(item);
    let bestScore = 0;
    let matched = false;

    for (const field of fields) {
      if (!field) continue;
      const res = fuzzyMatch(trimmed, field);
      if (res.matches && res.score > bestScore) {
        bestScore = res.score;
        matched = true;
      }
    }

    if (matched) {
      scored.push({ item, bestScore });
    }
  }

  return scored
    .sort((a, b) => b.bestScore - a.bestScore)
    .map((entry) => entry.item);
}
