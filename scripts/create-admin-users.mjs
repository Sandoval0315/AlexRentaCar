const admins = JSON.parse(process.env.ADMIN_USERS_JSON || '[]');

const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de ejecutar este script.');
}

if (!Array.isArray(admins) || admins.length === 0) {
  throw new Error('Define ADMIN_USERS_JSON con una lista de usuarios y contrasenas temporales.');
}

for (const admin of admins) {
  if (!admin?.email || typeof admin.password !== 'string' || admin.password.length < 12) {
    throw new Error('Cada administrador requiere email y una contrasena de al menos 12 caracteres.');
  }
}

async function supabaseFetch(path, options = {}) {
  const authHeaders = serviceRoleKey.startsWith('sb_')
    ? {}
    : { Authorization: `Bearer ${serviceRoleKey}` };
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      ...authHeaders,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...options.headers
    }
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.msg || data?.error || data?.message || `Error ${response.status}`);
  }
  return data;
}

async function createOrUpdateAdmin(admin) {
  let user;

  try {
    user = await supabaseFetch('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        app_metadata: { role: 'admin' },
        user_metadata: { full_name: admin.email.split('@')[0] }
      })
    });
  } catch (error) {
    if (!String(error.message).toLowerCase().includes('already')) {
      throw error;
    }

    const list = await supabaseFetch(`/auth/v1/admin/users?email=${encodeURIComponent(admin.email)}`);
    user = Array.isArray(list?.users)
      ? list.users.find((entry) => entry.email?.toLowerCase() === admin.email)
      : null;

    if (!user) {
      throw new Error(`El usuario ${admin.email} ya existe, pero no se pudo recuperar su ID.`);
    }

    await supabaseFetch(`/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        password: admin.password,
        email_confirm: true,
        app_metadata: { role: 'admin' }
      })
    });
  }

  await supabaseFetch('/rest/v1/admin_profiles', {
    method: 'POST',
    body: JSON.stringify({
      id: user.id,
      email: admin.email,
      full_name: admin.email.split('@')[0],
      is_admin: true
    })
  });

  return user;
}

for (const admin of admins) {
  const user = await createOrUpdateAdmin(admin);
  console.log(`${admin.email} listo (${user.id})`);
}
