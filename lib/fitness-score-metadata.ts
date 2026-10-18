export function preserveExcellenceMetadata(existingScores: unknown, nextScores: unknown): unknown {
  const cleanScores = nextScores && typeof nextScores === "object" && !Array.isArray(nextScores)
    ? Object.fromEntries(Object.entries(nextScores).filter(([key]) => key !== "_excellence"))
    : nextScores;
  if (!existingScores || typeof existingScores !== "object" || Array.isArray(existingScores)) return cleanScores;
  const excellence = (existingScores as Record<string, unknown>)._excellence;
  if (!excellence || typeof excellence !== "object" || Array.isArray(excellence)) return cleanScores;
  if (cleanScores && typeof cleanScores === "object" && !Array.isArray(cleanScores)) {
    return { ...(cleanScores as Record<string, unknown>), _excellence: excellence };
  }
  return { items: cleanScores ?? {}, _excellence: excellence };
}
