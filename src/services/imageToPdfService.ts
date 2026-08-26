import jsPDF from 'jspdf';

/**
 * Loads an image File into an HTMLImageElement to read its natural dimensions and normalize orientation
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = reader.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Compiles one or multiple image files into a single unified PDF (one image per page, fitting A4 cleanly)
 */
export async function compileImagesToPDF(
  imageFiles: File[],
  pdfTitle = 'documento_escaneado.pdf'
): Promise<{ pdfFile: File; pdfBlob: Blob; totalPages: number }> {
  if (imageFiles.length === 0) {
    throw new Error('No se han seleccionado imágenes para compilar.');
  }

  // Initialize jsPDF with standard A4 dimensions (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const a4Width = 210;
  const a4Height = 297;
  const margin = 10;
  const maxW = a4Width - margin * 2;
  const maxH = a4Height - margin * 2;

  for (let i = 0; i < imageFiles.length; i++) {
    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    const file = imageFiles[i];
    const img = await loadImageElement(file);

    // Calculate aspect ratio scaling to fit comfortably within A4 margins
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let renderW = maxW;
    let renderH = renderW / imgRatio;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = renderH * imgRatio;
    }

    // Center on page
    const posX = margin + (maxW - renderW) / 2;
    const posY = margin + (maxH - renderH) / 2;

    // Convert image to data URL format for jsPDF
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      doc.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    }
  }

  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], pdfTitle, { type: 'application/pdf' });

  return {
    pdfFile,
    pdfBlob,
    totalPages: imageFiles.length,
  };
}

/**
 * Downloads a generated PDF blob directly to the user's computer
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
