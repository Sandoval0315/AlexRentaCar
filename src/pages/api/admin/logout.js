import { clearAdminSessionCookie } from '../../../lib/admin-auth.js';

export async function POST({ cookies }) {
  clearAdminSessionCookie(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
