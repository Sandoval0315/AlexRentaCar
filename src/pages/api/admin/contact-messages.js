import { readAdminSession } from '../../../lib/admin-auth.js';
import { getContactMessages } from '../../../lib/data.js';

export async function GET({ cookies }) {
  const session = await readAdminSession(cookies);
  if (!session) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const rows = await getContactMessages(session.accessToken);
  return Response.json(rows);
}
