import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { Buffer } from 'buffer';

// This is needed to avoid PDF.js trying to load its own worker
GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry');

type RequestBody = {
  fileBase64?: string;
};

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  const loadingTask = getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(' ');
    text += pageText + '\n';
  }

  return text.trim();
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { fileBase64 } = req.body as RequestBody;

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid "fileBase64" in request body.',
      });
      return;
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const text = await extractTextFromPDF(buffer);

    res.status(200).json({ text });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[PDF Extract Error]', err);
    res.status(500).json({
      error: 'Failed to extract text from PDF.',
      details: err.message || 'Unknown error',
    });
  }
}
