import { lookupRentalRequest } from '../../../lib/data.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    const { requestCode, customerEmail } = await request.json();
    const rentalRequest = await lookupRentalRequest(requestCode, customerEmail);
    if (!rentalRequest) return json({ error: 'No encontramos una solicitud con esos datos.' }, 404);
    return json(rentalRequest);
  } catch (error) {
    return json({ error: error.message || 'No se pudo consultar la solicitud.' }, 400);
  }
}
