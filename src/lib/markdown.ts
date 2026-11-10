import { marked } from 'marked';

/** Convierte a HTML los campos markdown que vienen dentro de los JSON (bio, descripción). */
export function markdownAHtml(texto: string | undefined): string {
  return texto ? (marked.parse(texto, { async: false }) as string) : '';
}
