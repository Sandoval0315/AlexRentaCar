import { readAdminSession } from '../../../../lib/admin-auth.js';
import { deleteImport, updateImport } from '../../../../lib/data.js';

function unauthorized() {
  return new Response(JSON.stringify({ error: 'No autorizado.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PATCH({ params, request, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return unauthorized();
  }

  const payload = await request.json();
  const row = await updateImport(params.id, payload, session.accessToken);
  return new Response(JSON.stringify(row), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function DELETE({ params, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return unauthorized();
  }

  await deleteImport(params.id, session.accessToken);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
