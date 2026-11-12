/** Lowercases text and joins its words with dashes, e.g. "Rebel Alliance" → "rebel-alliance". */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
