import { GAME_SLUGS } from './game-slugs.mjs';

const slugs = new Set(GAME_SLUGS);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BYTES = 12_288;
const json = (value, status = 200, extra = {}) => Response.json(value, {status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra}});

async function readJSON(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const parts = []; let length = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); throw new Error('too_large'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
}

export async function handleFeedback(request, db) {
  if (request.method !== 'POST') return json({error: 'Method not allowed'}, 405, {Allow: 'POST'});
  // Hosted Sites dispatch authenticates visitors and injects this trusted identity.
  // Keep the existing private Site audience; do not expose this Worker directly.
  const userId = request.headers.get('oai-authenticated-user-id');
  if (!userId || userId.length > 256) return json({error: 'Sign in to send feedback'}, 401);
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({error: 'Request origin not allowed'}, 403);
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return json({error: 'JSON required'}, 415);
  let value;
  try { value = await readJSON(request); }
  catch (error) { return json({error: error.message === 'too_large' ? 'Feedback is too large' : 'Invalid JSON'}, error.message === 'too_large' ? 413 : 400); }
  if (!value || Array.isArray(value) || typeof value !== 'object'
      || Object.keys(value).some(key => !['id', 'slug', 'text'].includes(key))
      || typeof value.id !== 'string' || !UUID.test(value.id)
      || !slugs.has(value.slug) || typeof value.text !== 'string'
      || !value.text.trim() || value.text.length > 2000 || value.text.includes('\0')) {
    return json({error: 'Provide a UUID id, a known game slug, and feedback of 1–2000 characters'}, 400);
  }
  if (!db) return json({error: 'Feedback storage is unavailable. Please retry.'}, 503);
  const id = value.id.toLowerCase();
  try {
    // D1 batch executes atomically. The unique per-user key makes network retries safe.
    const results = await db.batch([
      db.prepare('INSERT INTO feedback (user_id, id, game_slug, text) VALUES (?, ?, ?, ?) ON CONFLICT (user_id, id) DO NOTHING').bind(userId, id, value.slug, value.text),
      db.prepare('SELECT id, game_slug, text, received_at FROM feedback WHERE user_id = ? AND id = ?').bind(userId, id),
    ]);
    if (results.length !== 2 || results.some(result => !result.success)) throw new Error('write_failed');
    const row = results[1].results?.[0];
    if (!row || typeof row.received_at !== 'string') throw new Error('missing_receipt');
    if (row.game_slug !== value.slug || row.text !== value.text) return json({error: 'This feedback id was already used for different feedback'}, 409);
    // Receipt is returned only after D1 has committed the batch and confirmed its row.
    return json({received: true, receipt: {id: row.id, receivedAt: row.received_at}}, results[0].meta?.changes === 1 ? 201 : 200);
  } catch {
    return json({error: 'Feedback was not confirmed. Keep your note and retry.'}, 503);
  }
}
