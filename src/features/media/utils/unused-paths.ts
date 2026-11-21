/**
 * The pictures that stopped being used by a save: those in `before` that are no longer in `after`.
 * Callers delete them from Storage once the new row is saved. Missing pictures (null) are ignored.
 */
export function unusedPaths(
  before: readonly (string | null)[],
  after: readonly (string | null)[],
): string[] {
  const stillUsed = new Set(after);
  return before.filter((path): path is string => path !== null && !stillUsed.has(path));
}
