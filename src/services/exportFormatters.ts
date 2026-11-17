import type { DocumentMetadata, ParagraphPair } from '../types';

export type PlainTextExportMode = 'translated-only' | 'interleaved' | 'side-by-side';

/**
 * Strips the last file extension from a filename.
 */
export function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * Formats bilingual paragraph pairs as plain text according to the selected mode.
 */
export function formatPlainText(
  pairs: ParagraphPair[],
  mode: PlainTextExportMode = 'translated-only'
): string {
  if (mode === 'translated-only') {
    return pairs.map((p) => p.translated || p.original).join('\n\n');
  }

  if (mode === 'interleaved') {
    return pairs
      .map(
        (p, idx) =>
          `[Párrafo ${idx + 1}]\nORIGINAL:\n${p.original}\n\nTRADUCCIÓN:\n${p.translated || '[Sin traducción]'}\n${'-'.repeat(40)}`
      )
      .join('\n\n');
  }

  return pairs
    .map(
      (p, idx) =>
        `--- Párrafo ${idx + 1} ---\n[ORIGINAL]:   ${p.original}\n[TRADUCCIÓN]: ${p.translated}`
    )
    .join('\n\n');
}

/**
 * Formats bilingual paragraph pairs as a Markdown table document.
 */
export function formatMarkdown(
  pairs: ParagraphPair[],
  metadata: DocumentMetadata,
  timestamp = new Date().toLocaleString()
): string {
  let md = `# Traducción Bilingüe: ${metadata.fileName}\n\n`;
  md += `*Fecha: ${timestamp} | Palabras: ${metadata.totalWords} | Generado con Bilex*\n\n`;
  md += `| # | Original | Traducción |\n`;
  md += `|---|---|---|\n`;

  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const cleanOrig = p.original.replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
    const cleanTrans = (p.translated || '').replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
    md += `| ${i + 1} | ${cleanOrig} | ${cleanTrans} |\n`;
  }

  return md;
}
