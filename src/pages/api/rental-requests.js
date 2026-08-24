import { createRentalRequest } from '../../lib/data.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    const payload = await request.json();
    const row = await createRentalRequest(payload);
    return json(row, 201);
  } catch (error) {
    return json({ error: error.message || 'No se pudo crear la solicitud.' }, 400);
  }
}
