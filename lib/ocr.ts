import Tesseract from 'tesseract.js';

export interface OcrResult {
  fullText: string;
  suggestedAmount: number | null;
  suggestedDescription: string;
}

async function resizeImage(dataUrl: string, maxWidth = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) { resolve(dataUrl); return; }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = dataUrl;
  });
}

export async function recognizeText(
  imageDataUrl: string,
  onProgress?: (p: number) => void
): Promise<OcrResult> {
  const resized = await resizeImage(imageDataUrl);
  const result = await Tesseract.recognize(resized, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;

  // Try to find amount: look for TOTAL, MONTANT, then largest price
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let suggestedAmount: number | null = null;
  let suggestedDescription = '';

  // Priority: lines with TOTAL or MONTANT
  const totalLine = lines.find((l) => /total|montant|amount|sum/i.test(l));

  const amountRegex = /(\d+[.,]\d{2})/g;

  if (totalLine) {
    const match = totalLine.match(amountRegex);
    if (match) {
      suggestedAmount = parseFloat(match[match.length - 1].replace(',', '.'));
    }
  }

  if (!suggestedAmount) {
    // Find all amounts and take the largest
    const allAmounts: number[] = [];
    for (const line of lines) {
      const matches = line.match(amountRegex);
      if (matches) {
        matches.forEach((m) => allAmounts.push(parseFloat(m.replace(',', '.'))));
      }
    }
    if (allAmounts.length > 0) {
      suggestedAmount = Math.max(...allAmounts);
    }
  }

  // Description: first non-amount line that looks like a business name
  suggestedDescription =
    lines.find((l) => l.length > 3 && l.length < 50 && !/^\d/.test(l)) || '';

  return { fullText: text, suggestedAmount, suggestedDescription };
}
