/**
 * Converts a Notion UUID string (without hyphens) to standard UUID format
 * @param notionUuid - 32 character Notion UUID string
 * @returns Standard UUID with hyphens
 * @throws Error if input is not 32 characters
 */
export function notionToStandardUuid(notionUuid: string): string {
  if (notionUuid.length !== 32) {
    throw new Error("Notion UUID must be 32 characters long");
  }

  return [
    notionUuid.slice(0, 8),
    notionUuid.slice(8, 12),
    notionUuid.slice(12, 16),
    notionUuid.slice(16, 20),
    notionUuid.slice(20, 32),
  ].join("-");
}
