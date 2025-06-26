import type { VercelRequest, VercelResponse } from '@vercel/node';

type RequestBody = {
  fileBase64?: string;
};

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
    const body = req.body as RequestBody;
    const { fileBase64 } = body;

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid "fileBase64" in request body.',
      });
      return;
    }

    const buffer = Buffer.from(fileBase64, 'base64');

    // 🔧 Dynamically import to prevent test suite from triggering
    const { default: pdfParse } = await import('pdf-parse');

    const parsed = await pdfParse(buffer);

    res.status(200).json({ text: parsed.text });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[PDF Parse Error]', err);
    res.status(500).json({
      error: 'Failed to parse PDF.',
      details: err.message || 'Unknown error',
    });
  }
}
