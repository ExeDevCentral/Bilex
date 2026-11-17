import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMarkdown,
  formatPlainText,
  stripFileExtension,
} from './exportFormatters.ts';
import type { DocumentMetadata, ParagraphPair } from '../types/index.ts';

const samplePairs: ParagraphPair[] = [
  {
    id: 'p-1-0',
    pageNumber: 1,
    original: 'Hello | world',
    translated: 'Hola | mundo',
    status: 'translated',
  },
  {
    id: 'p-1-1',
    pageNumber: 1,
    original: 'Second\nline',
    translated: '',
    status: 'pending',
  },
];

const sampleMetadata: DocumentMetadata = {
  fileName: 'libro.pdf',
  fileSize: 1024,
  totalPages: 1,
  totalParagraphs: 2,
  totalWords: 4,
  totalChars: 24,
  isScanned: false,
};

describe('exportFormatters', () => {
  it('strips file extensions cleanly', () => {
    assert.equal(stripFileExtension('libro.pdf'), 'libro');
    assert.equal(stripFileExtension('mi.archivo.v2.txt'), 'mi.archivo.v2');
    assert.equal(stripFileExtension('sin_extension'), 'sin_extension');
  });

  it('formats plain text in translated-only and interleaved modes', () => {
    const translatedOnly = formatPlainText(samplePairs, 'translated-only');
    assert.equal(translatedOnly, 'Hola | mundo\n\nSecond\nline');

    const interleaved = formatPlainText(samplePairs, 'interleaved');
    assert.match(interleaved, /\[Párrafo 1\]/);
    assert.match(interleaved, /\[Sin traducción\]/);
  });

  it('escapes pipes and newlines in Markdown table export', () => {
    const md = formatMarkdown(samplePairs, sampleMetadata, '2026-11-17');
    assert.match(md, /# Traducción Bilingüe: libro\.pdf/);
    assert.match(md, /\| 1 \| Hello \\\| world \| Hola \\\| mundo \|/);
    assert.match(md, /\| 2 \| Second<br\/>line \|  \|/);
  });
});
