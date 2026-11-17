import type { ParagraphPair } from '../types';

function createParagraphPair(
  pageNumber: number,
  index: number,
  original: string,
  confidence?: number
): ParagraphPair {
  return {
    id: `p-${pageNumber}-${index}`,
    pageNumber,
    original,
    translated: '',
    status: 'pending',
    confidence,
  };
}

/**
 * Normalizes raw text from PDF or OCR into well-formed paragraphs
 */
export function parseRawTextToParagraphs(
  rawText: string,
  pageNumber = 1,
  startIdIndex = 0,
  confidence?: number
): ParagraphPair[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // 1. Normalize line breaks
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Fix hyphenated line breaks (e.g., "algo- \nritmo" -> "algoritmo")
  text = text.replace(/([a-zA-ZáéíóúÁÉÍÓÚñÑ])-\s*\n\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ])/g, '$1$2');

  // 3. Normalize multiple blank lines to double newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  // 4. Split by logical blocks (double newlines)
  const rawBlocks = text.split(/\n\n+/);
  const pairs: ParagraphPair[] = [];
  let currentIndex = startIdIndex;

  for (const block of rawBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    // Check if the block is a list or contains bullet points/numbering
    const lines = trimmedBlock.split('\n').map((l) => l.trim()).filter(Boolean);
    
    // If lines in block look like list items or short distinct lines, keep them separate or merge intelligently
    let currentParagraphLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = /^(\d+[.)]|[-*•–—]|[a-zA-Z][.)])\s+/.test(line);
      const isHeading = line.length < 70 && !/[.,;:?!]$/.test(line) && i < lines.length - 1 && lines[i + 1].length > 60;

      if (isListItem || isHeading) {
        if (currentParagraphLines.length > 0) {
          const content = currentParagraphLines.join(' ').replace(/\s{2,}/g, ' ').trim();
          if (content) {
            pairs.push(createParagraphPair(pageNumber, currentIndex++, content, confidence));
          }
          currentParagraphLines = [];
        }
        currentParagraphLines.push(line);
        if (isHeading) {
          // Push heading as its own paragraph immediately
          pairs.push(createParagraphPair(pageNumber, currentIndex++, line, confidence));
          currentParagraphLines = [];
        }
      } else {
        currentParagraphLines.push(line);
      }
    }

    if (currentParagraphLines.length > 0) {
      const content = currentParagraphLines.join(' ').replace(/\s{2,}/g, ' ').trim();
      if (content) {
        pairs.push(createParagraphPair(pageNumber, currentIndex++, content, confidence));
      }
    }
  }

  return pairs;
}

/**
 * Calculates total character and word count for a set of paragraphs
 */
export function calculateTextStats(pairs: ParagraphPair[]): { charCount: number; wordCount: number } {
  let charCount = 0;
  let wordCount = 0;

  for (const pair of pairs) {
    charCount += pair.original.length;
    const words = pair.original.split(/\s+/).filter(Boolean);
    wordCount += words.length;
  }

  return { charCount, wordCount };
}

/**
 * Estimates reading time in whole minutes for a given word count.
 */
export function estimateReadingTimeMinutes(wordCount: number, wordsPerMinute = 200): number {
  if (wordCount <= 0 || wordsPerMinute <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
