import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '1mb' }));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

app.use((req, res, next) => {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') return res.status(200).send('ok');
  next();
});

const ALLOWED_GEMINI_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-lite',
]);
const MAX_CONTENT_LENGTH = 50_000;
const MAX_OUTPUT_TOKENS = 4096;

app.post('/api/gemini', async (req, res) => {
  try {
    const { contents, generationConfig, model: requestedModel } = req.body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'contents must be a non-empty array' });
    }

    const contentStr = JSON.stringify(contents);
    if (contentStr.length > MAX_CONTENT_LENGTH) {
      return res
        .status(400)
        .json({ error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` });
    }

    const geminiModel = typeof requestedModel === 'string' ? requestedModel : 'gemini-2.0-flash';
    if (!ALLOWED_GEMINI_MODELS.has(geminiModel)) {
      return res.status(400).json({ error: `Model "${geminiModel}" is not allowed` });
    }

    const cappedConfig = generationConfig ? { ...generationConfig } : undefined;
    if (
      cappedConfig &&
      typeof cappedConfig.maxOutputTokens === 'number' &&
      cappedConfig.maxOutputTokens > MAX_OUTPUT_TOKENS
    ) {
      cappedConfig.maxOutputTokens = MAX_OUTPUT_TOKENS;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents, generationConfig: cappedConfig }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      const sanitized = errorText.replace(new RegExp(apiKey, 'g'), '[REDACTED]');
      console.error('Gemini API Error:', geminiResponse.status, sanitized);
      return res.status(geminiResponse.status).json({ error: 'Upstream API error' });
    }

    const data = await geminiResponse.json();
    return res.json(data);
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/omdb', async (req, res) => {
  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OMDB_API_KEY is not configured on the server' });
    }

    const params = new URLSearchParams(req.query);
    params.set('apikey', apiKey);

    const omdbUrl = `https://www.omdbapi.com/?${params.toString()}`;
    const omdbResponse = await fetch(omdbUrl);

    if (!omdbResponse.ok) {
      return res.status(omdbResponse.status).json({ error: 'Upstream OMDB API error' });
    }

    const data = await omdbResponse.json();
    return res.json(data);
  } catch (err) {
    console.error('OMDB proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
