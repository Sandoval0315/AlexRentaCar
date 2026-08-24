import crypto from 'node:crypto';
import { readAdminSession } from '../../../lib/admin-auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getCloudinaryConfig() {
  return {
    cloudName: import.meta.env.CLOUDINARY_CLOUD_NAME || import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: import.meta.env.CLOUDINARY_API_KEY,
    apiSecret: import.meta.env.CLOUDINARY_API_SECRET,
    folder: import.meta.env.CLOUDINARY_FOLDER || 'alex-renta-cars'
  };
}

function signParams(params, apiSecret) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

export async function POST({ request, cookies }) {
  if (!await readAdminSession(cookies)) {
    return json({ error: 'No autorizado.' }, 401);
  }

  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    return json({ error: 'Cloudinary no esta configurado en el servidor.' }, 500);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return json({ error: 'Archivo requerido.' }, 400);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: config.folder,
    timestamp
  };
  const signature = signParams(params, config.apiSecret);

  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append('api_key', config.apiKey);
  uploadData.append('folder', config.folder);
  uploadData.append('timestamp', String(timestamp));
  uploadData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: uploadData
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json({ error: data.error?.message || 'No se pudo subir la imagen.' }, response.status);
  }

  return json({
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes
  });
}
