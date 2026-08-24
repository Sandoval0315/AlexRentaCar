import { readAdminSession } from '../../../../lib/admin-auth.js';
import { deleteRentalRequest, updateRentalRequest } from '../../../../lib/data.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function unauthorized() {
  return json({ error: 'No autorizado.' }, 401);
}

export async function PATCH({ params, request, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return unauthorized();
  }

  const payload = await request.json();
  const row = await updateRentalRequest(params.id, payload, session.accessToken);
  return json(row);
}

export async function DELETE({ params, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return unauthorized();
  }

  await deleteRentalRequest(params.id, session.accessToken);
  return json({ ok: true });
}
