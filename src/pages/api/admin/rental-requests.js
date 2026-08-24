import { readAdminSession } from '../../../lib/admin-auth.js';
import { getRentalRequests } from '../../../lib/data.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function unauthorized() {
  return json({ error: 'No autorizado.' }, 401);
}

export async function GET({ cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return unauthorized();
  }

  const rows = await getRentalRequests(session.accessToken);
  return json(rows);
}
