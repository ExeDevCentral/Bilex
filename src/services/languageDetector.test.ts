import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguageFromText } from './languageDetector.ts';

describe('languageDetector', () => {
  it('returns null for short text under 25 characters', () => {
    assert.equal(detectLanguageFromText('Hola mundo'), null);
    assert.equal(detectLanguageFromText('   short   '), null);
  });

  it('detects Spanish text and marks long text as reliable', () => {
    const sample =
      'Esta es una oración suficientemente larga en español para que el detector de idiomas funcione correctamente y sea confiable.';
    const result = detectLanguageFromText(sample);
    assert.ok(result);
    assert.equal(result.code, 'ES');
    assert.equal(result.iso3, 'spa');
    assert.equal(result.isReliable, true);
  });

  it('detects English text', () => {
    const sample =
      'This is a sufficiently long English sentence so that the offline language detector identifies it accurately.';
    const result = detectLanguageFromText(sample);
    assert.ok(result);
    assert.equal(result.code, 'EN');
    assert.equal(result.iso3, 'eng');
    assert.equal(result.isReliable, true);
  });
});
