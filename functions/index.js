import { GoogleGenAI } from '@google/genai';
import { onRequest } from 'firebase-functions/v2/https';

const MODEL = 'gemini-3.1-flash-live-preview';

function sendJson(res, status, body) {
  res.set('Cache-Control', 'no-store, max-age=0');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(status).json(body);
}

export const liveToken = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true,
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured for the liveToken function.');
      sendJson(res, 503, { error: 'live_ai_not_configured' });
      return;
    }

    try {
      const client = new GoogleGenAI({ apiKey });
      const now = Date.now();
      const token = await client.authTokens.create({
        config: {
          uses: 1,
          expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
          newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
          liveConnectConstraints: {
            model: MODEL,
            config: {
              sessionResumption: {},
              responseModalities: ['AUDIO'],
            },
          },
        },
      });

      if (!token?.name) {
        throw new Error('Gemini did not return an ephemeral token.');
      }

      sendJson(res, 200, {
        token: token.name,
        model: MODEL,
        expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error('Failed to provision Gemini Live token:', error);
      sendJson(res, 502, { error: 'live_token_provisioning_failed' });
    }
  },
);
