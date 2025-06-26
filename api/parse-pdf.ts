import type { VercelRequest, VercelResponse } from '@vercel/node';

type RequestBody = { fileBase64?: string };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const { fileBase64 } = req.body as RequestBody;

  // Validate body
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "fileBase64" in request body.' });
    return;
  }

  try {
    // Convert Base64 → Buffer
    const buffer = Buffer.from(fileBase64, 'base64');

    // Dynamic import so the full pdf-parse package (with its test files) is loaded at runtime
    const pdfParse = (await import('pdf-parse')).default;

    // Extract text
    const { text } = await pdfParse(buffer);

    // Success
    res.status(200).json({ text });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[PDF Parse Error]', err);
    res.status(500).json({
      error: 'Failed to parse PDF.',
      details: err.message || 'Unknown error',
    });
  }
}