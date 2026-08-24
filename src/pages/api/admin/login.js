import { createAdminSessionValue, setAdminSessionCookie, verifySupabaseAdminCredentials } from '../../../lib/admin-auth.js';

export async function POST({ request, cookies }) {
  const { email, password } = await request.json();
  const admin = await verifySupabaseAdminCredentials(email, password).catch(() => null);

  if (!admin) {
    return new Response(JSON.stringify({ error: 'Credenciales invalidas.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sessionValue = createAdminSessionValue(admin.accessToken);
  setAdminSessionCookie(cookies, sessionValue);

  return new Response(JSON.stringify({ ok: true, email: admin.email }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
