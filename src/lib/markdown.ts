import { marked } from 'marked';

/** Converts to HTML the markdown fields that come inside the JSON files (bio, description). */
export function markdownToHtml(text: string | undefined): string {
  return text ? (marked.parse(text, { async: false }) as string) : '';
}
