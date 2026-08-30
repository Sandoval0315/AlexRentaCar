// Estos valores son publicables por diseño. RLS protege los datos y las operaciones.
const DEFAULT_SUPABASE_URL = 'https://qiedsxwspolgsqloaodh.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VY0NKjnBdrVnsAfTVZNk5w_yNplNaNu';

function getSupabaseConfig() {
  const url = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    anonKey,
    serviceRoleKey
  };
}

export function hasSupabase() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function hasSupabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey);
}

export async function supabaseRequest(path, { method = 'GET', body, admin = false, token, returnRepresentation = true } = {}) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error('Supabase no configurado.');
  }

  const apiKey = admin && serviceRoleKey ? serviceRoleKey : anonKey;
  const headers = {
    apikey: apiKey,
    'Content-Type': 'application/json',
    Prefer: returnRepresentation ? 'return=representation' : 'return=minimal'
  };

  // Las claves sb_publishable_/sb_secret_ no son JWT. Solo los tokens de
  // usuario (o las claves legacy basadas en JWT) deben ir como Bearer.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (!apiKey.startsWith('sb_')) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error al consultar Supabase.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

export async function signInWithPassword(email, password) {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error('Supabase Auth no configurado.');
  }

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.msg || data.error || 'Credenciales invalidas.');
  }

  return data;
}

export async function getAuthUser(accessToken) {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !accessToken) {
    throw new Error('Sesion no configurada.');
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.msg || data.error || 'Sesion invalida.');
  }
  return data;
}

export async function createAuthUser({ email, password, fullName, role = 'admin' }) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY es requerido para crear usuarios.');
  }

  const headers = {
    apikey: serviceRoleKey,
    'Content-Type': 'application/json'
  };
  if (!serviceRoleKey.startsWith('sb_')) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || email },
      app_metadata: { role }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.msg || data.error || `No se pudo crear ${email}.`);
  }

  return data;
}
