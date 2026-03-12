import express from 'express';

// Keep the API proxy usable with the same `.env` file Vite uses in dev.
// Node's `process.loadEnvFile` is available in modern Node; ignore missing `.env`.
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
    if (code !== 'ENOENT') {
      throw error;
    }
  }
}

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '1mb' }));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, if-none-match',
  'Access-Control-Expose-Headers': 'ETag',
};

const cleanEnvValue = (value) =>
  typeof value === 'string' ? value.trim().replace(/^["']|["']$/g, '') : '';

const readEnv = (...names) => {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name]);
    if (value) {
      return value;
    }
  }

  return '';
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
      return res.status(400).json({ error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` });
    }

    const geminiModel = typeof requestedModel === 'string' ? requestedModel : 'gemini-2.0-flash';
    if (!ALLOWED_GEMINI_MODELS.has(geminiModel)) {
      return res.status(400).json({ error: `Model "${geminiModel}" is not allowed` });
    }

    const cappedConfig = generationConfig ? { ...generationConfig } : undefined;
    if (cappedConfig && typeof cappedConfig.maxOutputTokens === 'number' && cappedConfig.maxOutputTokens > MAX_OUTPUT_TOKENS) {
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
    const apiKey = readEnv('OMDB_API_KEY', 'VITE_OMDB_API_KEY');
    if (!apiKey) {
      return res.status(500).json({
        error: 'OMDB_API_KEY or VITE_OMDB_API_KEY is not configured on the server',
      });
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

app.get('/api/gist', async (req, res) => {
  try {
    const gistId = readEnv('GIST_ID', 'VITE_GIST_ID');
    const token = readEnv('GIST_TOKEN', 'VITE_GIST_TOKEN');

    if (!gistId) {
      return res.status(500).json({ error: 'GIST_ID is not configured on the server' });
    }

    const headers = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const eTag = req.headers['if-none-match'];
    if (eTag) {
      headers['If-None-Match'] = eTag;
    }

    const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    const responseETag = gistResponse.headers.get('ETag');

    if (responseETag) {
      res.setHeader('ETag', responseETag);
    }

    if (gistResponse.status === 304) {
      return res.status(304).send();
    }

    if (!gistResponse.ok) {
      return res.status(gistResponse.status).json({ error: 'Upstream GitHub API error' });
    }

    const data = await gistResponse.json();
    return res.json(data);
  } catch (err) {
    console.error('Gist proxy GET error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/gist', async (req, res) => {
  try {
    const gistId = readEnv('GIST_ID', 'VITE_GIST_ID');
    const token = readEnv('GIST_TOKEN', 'VITE_GIST_TOKEN');

    if (!gistId) {
      return res.status(500).json({ error: 'GIST_ID is not configured on the server' });
    }

    if (!token) {
      return res.status(500).json({ error: 'GIST_TOKEN is not configured on the server' });
    }

    const { files } = req.body;
    if (!files || typeof files !== 'object') {
      return res.status(400).json({ error: 'Invalid payload: missing files object' });
    }

    const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });

    if (!gistResponse.ok) {
      const errorText = await gistResponse.text();
      const sanitized = token ? errorText.split(token).join('[REDACTED]') : errorText;
      console.error('Gist API Error:', gistResponse.status, sanitized);
      return res.status(gistResponse.status).json({ error: 'Upstream GitHub API error' });
    }

    const data = await gistResponse.json();
    return res.json(data);
  } catch (err) {
    console.error('Gist proxy PATCH error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
