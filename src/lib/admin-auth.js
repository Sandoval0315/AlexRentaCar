import { getAuthUser, hasSupabase, signInWithPassword, supabaseRequest } from './supabase.js';

const COOKIE_NAME = 'alex_admin_session';

function getAdminEmails() {
  return String(import.meta.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function userIsAdmin(user, accessToken) {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!user?.id || !email) return false;
  if (user.app_metadata?.role === 'admin' || getAdminEmails().includes(email)) return true;

  try {
    const rows = await supabaseRequest(
      `admin_profiles?select=id&email=eq.${encodeURIComponent(email)}&is_admin=eq.true&limit=1`,
      { token: accessToken }
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function verifySupabaseAdminCredentials(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!hasSupabase() || !normalizedEmail || !password) return null;

  const auth = await signInWithPassword(normalizedEmail, password);
  if (!await userIsAdmin(auth.user, auth.access_token)) return null;

  return {
    email: normalizedEmail,
    userId: auth.user.id,
    accessToken: auth.access_token
  };
}

export function createAdminSessionValue(accessToken) {
  if (!accessToken) throw new Error('Token de sesion requerido.');
  return accessToken;
}

export async function readAdminSession(cookies) {
  const accessToken = cookies.get(COOKIE_NAME)?.value;
  if (!accessToken) return null;

  try {
    const user = await getAuthUser(accessToken);
    if (!await userIsAdmin(user, accessToken)) return null;
    return {
      email: String(user.email || '').toLowerCase(),
      userId: user.id,
      accessToken
    };
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(cookies, value) {
  cookies.set(COOKIE_NAME, value, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 60 * 60
  });
}

export function clearAdminSessionCookie(cookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function requireAdmin(Astro) {
  const session = await readAdminSession(Astro.cookies);
  if (!session) return Astro.redirect('/admin/login');
  return session;
}
