import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRawTextToParagraphs,
  calculateTextStats,
  estimateReadingTimeMinutes,
} from './paragraphParser.ts';

describe('paragraphParser', () => {
  it('returns empty array for blank or whitespace-only input', () => {
    assert.deepEqual(parseRawTextToParagraphs(''), []);
    assert.deepEqual(parseRawTextToParagraphs('   \n\r\n  '), []);
  });

  it('rejoins hyphenated line breaks across lines', () => {
    const raw = 'Este es un algo-\nritmo de prueba.';
    const pairs = parseRawTextToParagraphs(raw, 2, 0, 0.95);
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].id, 'p-2-0');
    assert.equal(pairs[0].pageNumber, 2);
    assert.equal(pairs[0].confidence, 0.95);
    assert.equal(pairs[0].original, 'Este es un algoritmo de prueba.');
    assert.equal(pairs[0].status, 'pending');
  });

  it('splits headings and list items into distinct paragraphs', () => {
    const raw = [
      'Capítulo Uno',
      'Este es un párrafo suficientemente largo que sigue inmediatamente después del título principal del capítulo.',
      '',
      '1. Primer punto importante.',
      '2. Segundo punto importante.',
    ].join('\n');

    const pairs = parseRawTextToParagraphs(raw, 1, 10);
    assert.equal(pairs.length, 4);
    assert.equal(pairs[0].id, 'p-1-10');
    assert.equal(pairs[0].original, 'Capítulo Uno');
    assert.match(pairs[1].original, /^Este es un párrafo/);
    assert.equal(pairs[2].original, '1. Primer punto importante.');
    assert.equal(pairs[3].original, '2. Segundo punto importante.');
  });

  it('calculates character and word counts accurately', () => {
    const pairs = parseRawTextToParagraphs('Hola mundo.\n\nTres palabras más.');
    const stats = calculateTextStats(pairs);
    assert.equal(stats.wordCount, 5);
    assert.equal(stats.charCount, 'Hola mundo.'.length + 'Tres palabras más.'.length);
  });

  it('estimates reading time in minutes', () => {
    assert.equal(estimateReadingTimeMinutes(0), 0);
    assert.equal(estimateReadingTimeMinutes(-10), 0);
    assert.equal(estimateReadingTimeMinutes(50), 1);
    assert.equal(estimateReadingTimeMinutes(401, 200), 3);
  });
});
