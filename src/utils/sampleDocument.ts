import type { ParagraphPair, DocumentMetadata } from '../types';

export function getSampleDocument(): { pairs: ParagraphPair[]; metadata: DocumentMetadata } {
  const sampleOriginals = [
    {
      pageNumber: 1,
      text: 'Artificial intelligence and neural network architectures have experienced unprecedented advancements in recent years, reshaping the paradigm of natural language processing and computer vision systems worldwide.',
    },
    {
      pageNumber: 1,
      text: 'The transformer architecture, introduced in 2017, relies entirely on self-attention mechanisms to compute representations of its input and output without using sequence-aligned recurrent neural networks or convolutions.',
    },
    {
      pageNumber: 1,
      text: 'Dual-pane reading interfaces provide significant cognitive benefits for polyglot researchers and translation professionals, allowing instantaneous semantic comparison between source syntax and translated vernacular.',
    },
    {
      pageNumber: 2,
      text: 'Optical Character Recognition (OCR) engines powered by WebAssembly allow client-side document digitization directly within the browser sandbox, preserving user data privacy while eliminating server processing latency.',
    },
    {
      pageNumber: 2,
      text: 'Furthermore, synchronized paragraph alignment minimizes cognitive load during intensive document analysis, enabling smooth contextual verification across technical terminology, mathematical notation, and domain-specific acronyms.',
    },
    {
      pageNumber: 2,
      text: 'In conclusion, combining client-side WebAssembly OCR with robust language translation models delivers an efficient, private, and versatile bilingual document reading environment.',
    },
  ];

  const pairs: ParagraphPair[] = sampleOriginals.map((item, idx) => ({
    id: `sample-${idx + 1}`,
    pageNumber: item.pageNumber,
    original: item.text,
    translated: '',
    status: 'pending',
  }));

  let totalChars = 0;
  let totalWords = 0;
  for (const item of sampleOriginals) {
    totalChars += item.text.length;
    totalWords += item.text.split(' ').length;
  }

  const metadata: DocumentMetadata = {
    fileName: 'sample_research_paper.pdf',
    fileSize: 48200,
    fileType: 'pdf',
    totalPages: 2,
    totalCharacters: totalChars,
    totalWords: totalWords,
    isScanned: false,
    uploadedAt: new Date().toISOString(),
  };

  return { pairs, metadata };
}
