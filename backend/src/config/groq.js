// server/src/config/groq.js
import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || '';

/**
 * Determine if the configured model supports vision (image) input.
 * Simple heuristic: model name contains 'vision' (case‑insensitive).
 */
export function modelSupportsVision(model) {
  return /vision/i.test(model);
}

/**
 * Generic call to Groq chat/completions endpoint.
 * If the model supports vision, `imageUrl` should be provided and will be sent
 * as a base64‑encoded data URI in the messages (as per Groq's vision API).
 */
export async function callGroq({ systemPrompt, userMessage, imageUrl }) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  if (!GROQ_VISION_MODEL) {
    throw new Error('GROQ_VISION_MODEL is not configured');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${GROQ_API_KEY}`,
  };

  const messages = [{ role: 'system', content: systemPrompt }];

  if (imageUrl && modelSupportsVision(GROQ_VISION_MODEL)) {
    // Fetch image and encode as base64 data URI (simple approach)
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image for analysis');
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mime = response.headers.get('content-type') || 'image/jpeg';
    const dataUri = `data:${mime};base64,${base64}`;
    messages.push({ role: 'user', content: [{ type: 'image', image: dataUri }, { type: 'text', text: userMessage }] });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  const payload = {
    model: GROQ_VISION_MODEL,
    messages,
    temperature: 0.2,
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    const err = new Error(`Groq API error: ${res.status}`);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }

  const data = await res.json();
  // Expect first choice's message content to be a JSON string
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq response missing content');
  }
  // Try parsing JSON; if parsing fails, treat as plain text error
  try {
    return JSON.parse(content);
  } catch (e) {
    // Return raw content for fallback handling
    return { raw: content };
  }
}

export const groqConfig = {
  apiKey: GROQ_API_KEY,
  model: GROQ_VISION_MODEL,
  supportsVision: modelSupportsVision(GROQ_VISION_MODEL),
};
