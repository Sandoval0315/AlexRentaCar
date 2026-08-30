import { createContactMessage } from '../../lib/data.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    const payload = await request.json();
    const message = await createContactMessage(payload);
    return json({ ok: true, id: message.id }, 201);
  } catch (error) {
    return json({ error: error.message || 'No se pudo guardar el mensaje.' }, 400);
  }
}
