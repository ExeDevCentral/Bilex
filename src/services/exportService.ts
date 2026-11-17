import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentMetadata, ParagraphPair, ExportOptions } from '../types';
import {
  formatMarkdown,
  formatPlainText,
  stripFileExtension,
  type PlainTextExportMode,
} from './exportFormatters';

/**
 * Generates and downloads a bilingual dual-column PDF
 */
export function exportBilingualPDF(
  pairs: ParagraphPair[],
  metadata: DocumentMetadata,
  options?: Partial<ExportOptions>
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bilex — Lectura y Traducción Bilingüe', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`Documento: ${metadata.fileName} | Fecha: ${new Date().toLocaleDateString()}`, 14, 18);

  // 2. Prepare table rows
  const tableData = pairs.map((p, idx) => [
    `#${idx + 1}\n\n${p.original}`,
    p.translated || '[Sin traducción]',
  ]);

  // 3. Render bilingual table
  autoTable(doc, {
    startY: 30,
    head: [['Texto Original', 'Traducción']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: options?.fontSize || 9,
      textColor: [30, 41, 59],
      cellPadding: 4,
      valign: 'top',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    columnStyles: {
      0: { cellWidth: (pageWidth - 28) / 2 },
      1: { cellWidth: (pageWidth - 28) / 2 },
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        `Página ${data.pageNumber} | Generado con Bilex`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  // 4. Save file
  const baseName = stripFileExtension(metadata.fileName);
  doc.save(`${baseName}_bilingue_bilex.pdf`);
}

/**
 * Exports text as plain text (.txt)
 */
export function exportPlainText(
  pairs: ParagraphPair[],
  metadata: DocumentMetadata,
  mode: PlainTextExportMode = 'translated-only'
): void {
  const baseName = stripFileExtension(metadata.fileName);
  const content = formatPlainText(pairs, mode);
  downloadFile(`${baseName}_${mode}.txt`, content, 'text/plain;charset=utf-8');
}

/**
 * Exports bilingual content to Markdown (.md)
 */
export function exportMarkdown(pairs: ParagraphPair[], metadata: DocumentMetadata): void {
  const baseName = stripFileExtension(metadata.fileName);
  const md = formatMarkdown(pairs, metadata);
  downloadFile(`${baseName}_bilingue.md`, md, 'text/markdown;charset=utf-8');
}

/**
 * Exports the full project state as a JSON file
 */
export function exportProjectJSON(pairs: ParagraphPair[], metadata: DocumentMetadata): void {
  const baseName = stripFileExtension(metadata.fileName);
  const data = {
    app: 'Bilex',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    metadata,
    pairs,
  };

  downloadFile(
    `${baseName}_bilex_session.json`,
    JSON.stringify(data, null, 2),
    'application/json;charset=utf-8'
  );
}

/**
 * Utility function to trigger browser download
 */
function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
