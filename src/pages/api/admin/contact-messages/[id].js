import { readAdminSession } from '../../../../lib/admin-auth.js';
import { deleteContactMessage, updateContactMessage } from '../../../../lib/data.js';

function unauthorized() {
  return Response.json({ error: 'No autorizado.' }, { status: 401 });
}

export async function PATCH({ params, request, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) return unauthorized();

  try {
    const row = await updateContactMessage(params.id, await request.json(), session.accessToken);
    return Response.json(row);
  } catch (error) {
    return Response.json({ error: error.message || 'No se pudo actualizar.' }, { status: 400 });
  }
}

export async function DELETE({ params, cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) return unauthorized();

  await deleteContactMessage(params.id, session.accessToken);
  return Response.json({ ok: true });
}
