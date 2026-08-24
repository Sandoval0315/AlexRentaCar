import { readAdminSession } from '../../../lib/admin-auth.js';
import { getRentals, upsertRental } from '../../../lib/data.js';

function unauthorized() {
  return new Response(JSON.stringify({ error: 'No autorizado.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET() {
  const rows = await getRentals();
  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return unauthorized();
  }

  const payload = await request.json();
  const row = await upsertRental(payload, session.accessToken);
  return new Response(JSON.stringify(row), {
    headers: { 'Content-Type': 'application/json' }
  });
}
