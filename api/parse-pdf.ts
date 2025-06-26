import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Allow only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    /* -----------------------------------------------------------
       1. Collect the raw binary body
    ----------------------------------------------------------- */
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    /* -----------------------------------------------------------
       2. Quick sanity check (optional but helpful)
    ----------------------------------------------------------- */
    if (buffer.slice(0, 4).toString() !== '%PDF') {
      throw new Error('Request body does not start with %PDF header');
    }

    /* -----------------------------------------------------------
       3. Dynamically import pdf‑parse (inner implementation)
    ----------------------------------------------------------- */
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;

    /* -----------------------------------------------------------
       4. Parse the PDF and return the text
    ----------------------------------------------------------- */
    const { text } = await pdfParse(buffer);

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