import { hasSupabase, supabaseRequest } from './supabase.js';

const fallbackRentals = [
  {
    id: '1',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    price_per_day: 45,
    category: 'sedan',
    transmission: 'automatica',
    seats: 5,
    fuel_type: 'gasolina',
    features: ['Aire Acondicionado', 'Bluetooth', 'Camara de Retroceso'],
    images: ['/img/toyota-corolla-2023-1.jpg', '/img/toyota_corolla_2023_2.jpeg'],
    available: true,
    featured: true,
    description: 'Sedan confiable y economico para viajes de negocios o placer.',
    status: 'Disponible',
    created_at: '2026-01-10T08:00:00.000Z'
  },
  {
    id: '2',
    brand: 'Honda',
    model: 'CR-V',
    year: 2024,
    price_per_day: 65,
    category: 'suv',
    transmission: 'automatica',
    seats: 5,
    fuel_type: 'hibrido',
    features: ['GPS', 'Asientos de Cuero', 'Sensores de Estacionamiento'],
    images: ['/img/honda-cr1.jpg'],
    available: true,
    featured: true,
    description: 'SUV espacioso y eficiente para la familia.',
    status: 'Disponible',
    created_at: '2026-02-14T08:00:00.000Z'
  },
  {
    id: '3',
    brand: 'Ford',
    model: 'Explorer',
    year: 2024,
    price_per_day: 75,
    category: 'suv',
    transmission: 'automatica',
    seats: 7,
    fuel_type: 'gasolina',
    features: ['Tercera Fila', 'Sistema de Sonido Premium', 'Control de Traccion'],
    images: ['/img/ford-explorer1.jpg'],
    available: false,
    featured: false,
    description: 'SUV familiar con capacidad para 7 pasajeros.',
    status: 'Reservado',
    created_at: '2026-03-03T08:00:00.000Z'
  }
];

const fallbackImports = [
  {
    id: 'imp-1',
    title: 'Toyota RAV4 XLE 2024',
    brand: 'Toyota',
    model: 'RAV4',
    year: 2024,
    condition: 'Excelente',
    status: 'Entregado',
    transit_time_days: 28,
    shipping_method: 'Maritimo',
    origin: 'Houston, TX',
    destination: 'San Salvador',
    price: 18450,
    client_name: 'Carlos Hernandez',
    summary: 'SUV importado desde subasta certificada con historial limpio.',
    images: ['/img/hyundai_tucson_2023_1.jpeg'],
    featured: true,
    created_at: '2026-04-01T08:00:00.000Z'
  },
  {
    id: 'imp-2',
    title: 'Honda Civic Sport 2023',
    brand: 'Honda',
    model: 'Civic',
    year: 2023,
    condition: 'Muy bueno',
    status: 'En aduana',
    transit_time_days: 19,
    shipping_method: 'Terrestre',
    origin: 'Guatemala',
    destination: 'San Salvador',
    price: 13900,
    client_name: 'Maria Lopez',
    summary: 'Vehiculo compacto con entrega acelerada para uso urbano.',
    images: ['/img/centra2023-1.jpg'],
    featured: true,
    created_at: '2026-04-20T08:00:00.000Z'
  }
];

const fallbackRentalRequests = [];

const CATEGORY_LABELS = {
  sedan: 'Sedan',
  suv: 'SUV',
  compacto: 'Compacto',
  deportivo: 'Deportivo',
  van: 'Van',
  pickup: 'Pickup'
};

const FUEL_LABELS = {
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  electrico: 'Electrico',
  hibrido: 'Hibrido'
};

const TRANSMISSION_LABELS = {
  automatica: 'Automatica',
  manual: 'Manual'
};

function normalizeRental(item) {
  return {
    id: item.id || crypto.randomUUID?.() || String(Date.now()),
    brand: item.brand || '',
    model: item.model || '',
    year: Number(item.year || 0),
    price_per_day: Number(item.price_per_day || 0),
    category: item.category || 'sedan',
    transmission: item.transmission || 'automatica',
    seats: Number(item.seats || 5),
    fuel_type: item.fuel_type || 'gasolina',
    features: Array.isArray(item.features) ? item.features : [],
    images: Array.isArray(item.images) ? item.images : [],
    available: Boolean(item.available),
    featured: Boolean(item.featured),
    description: item.description || '',
    status: item.status || (item.available ? 'Disponible' : 'No disponible'),
    created_at: item.created_at || new Date().toISOString()
  };
}

function normalizeImport(item) {
  return {
    id: item.id || crypto.randomUUID?.() || String(Date.now()),
    title: item.title || '',
    brand: item.brand || '',
    model: item.model || '',
    year: Number(item.year || 0),
    condition: item.condition || '',
    status: item.status || '',
    transit_time_days: Number(item.transit_time_days || 0),
    shipping_method: item.shipping_method || '',
    origin: item.origin || '',
    destination: item.destination || '',
    price: Number(item.price || 0),
    client_name: item.client_name || '',
    summary: item.summary || '',
    images: Array.isArray(item.images) ? item.images : [],
    featured: Boolean(item.featured),
    created_at: item.created_at || new Date().toISOString()
  };
}

function normalizeRentalRequest(item) {
  return {
    id: item.id || crypto.randomUUID?.() || String(Date.now()),
    rental_id: item.rental_id || '',
    customer_name: item.customer_name || '',
    customer_email: item.customer_email || '',
    customer_phone: item.customer_phone || '',
    start_date: item.start_date || '',
    end_date: item.end_date || '',
    notes: item.notes || '',
    status: item.status || 'pendiente',
    total_estimate: Number(item.total_estimate || 0),
    rental_snapshot: item.rental_snapshot || null,
    created_at: item.created_at || new Date().toISOString()
  };
}

function cleanRentalPayload(payload) {
  return {
    brand: String(payload.brand || '').trim().slice(0, 80),
    model: String(payload.model || '').trim().slice(0, 80),
    year: Number(payload.year || 0),
    price_per_day: Number(payload.price_per_day || 0),
    category: String(payload.category || 'sedan').trim().slice(0, 40),
    transmission: String(payload.transmission || 'automatica').trim().slice(0, 40),
    seats: Number(payload.seats || 5),
    fuel_type: String(payload.fuel_type || 'gasolina').trim().slice(0, 40),
    features: Array.isArray(payload.features) ? payload.features.map((value) => String(value).trim().slice(0, 120)).filter(Boolean).slice(0, 30) : [],
    images: Array.isArray(payload.images) ? payload.images.map((value) => String(value).trim()).filter(Boolean).slice(0, 12) : [],
    available: Boolean(payload.available),
    featured: Boolean(payload.featured),
    description: String(payload.description || '').trim().slice(0, 3000),
    status: String(payload.status || 'Disponible').trim().slice(0, 60)
  };
}

function cleanImportPayload(payload) {
  return {
    title: String(payload.title || '').trim().slice(0, 160),
    brand: String(payload.brand || '').trim().slice(0, 80),
    model: String(payload.model || '').trim().slice(0, 80),
    year: Number(payload.year || 0),
    condition: String(payload.condition || '').trim().slice(0, 80),
    status: String(payload.status || '').trim().slice(0, 80),
    transit_time_days: Number(payload.transit_time_days || 0),
    shipping_method: String(payload.shipping_method || '').trim().slice(0, 80),
    origin: String(payload.origin || '').trim().slice(0, 160),
    destination: String(payload.destination || '').trim().slice(0, 160),
    price: Number(payload.price || 0),
    client_name: String(payload.client_name || '').trim().slice(0, 160),
    summary: String(payload.summary || '').trim().slice(0, 3000),
    images: Array.isArray(payload.images) ? payload.images.map((value) => String(value).trim()).filter(Boolean).slice(0, 12) : [],
    featured: Boolean(payload.featured)
  };
}

function validateRentalPayload(payload) {
  const currentYear = new Date().getFullYear() + 1;
  if (!payload.brand || !payload.model || !Number.isInteger(payload.year) || payload.year < 1990 || payload.year > currentYear) {
    throw new Error('Los datos principales del vehiculo no son validos.');
  }
  if (!Number.isFinite(payload.price_per_day) || payload.price_per_day < 0 || !Number.isInteger(payload.seats) || payload.seats < 2 || payload.seats > 20) {
    throw new Error('El precio o la capacidad no son validos.');
  }
}

function validateImportPayload(payload) {
  const currentYear = new Date().getFullYear() + 1;
  if (!payload.title || !payload.brand || !payload.model || !Number.isInteger(payload.year) || payload.year < 1990 || payload.year > currentYear) {
    throw new Error('Los datos principales de la importacion no son validos.');
  }
  if (!Number.isFinite(payload.price) || payload.price < 0 || !Number.isInteger(payload.transit_time_days) || payload.transit_time_days < 0) {
    throw new Error('El precio o el tiempo de transito no son validos.');
  }
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 1;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

function cleanRentalRequestPayload(payload, rental) {
  const startDate = String(payload.start_date || payload.startDate || '');
  const endDate = String(payload.end_date || payload.endDate || '');
  const dailyPrice = Number(rental?.price_per_day || 0);

  return {
    rental_id: String(payload.rental_id || payload.rentalId || ''),
    customer_name: String(payload.customer_name || payload.customerName || '').trim(),
    customer_email: String(payload.customer_email || payload.customerEmail || '').trim().toLowerCase(),
    customer_phone: String(payload.customer_phone || payload.customerPhone || '').trim(),
    start_date: startDate,
    end_date: endDate,
    notes: String(payload.notes || '').trim(),
    status: 'pendiente',
    total_estimate: dailyPrice * daysBetween(startDate, endDate),
    rental_snapshot: rental
      ? {
          id: rental.id,
          brand: rental.brand,
          model: rental.model,
          year: rental.year,
          price_per_day: rental.price_per_day,
          image: rental.images?.[0] || ''
        }
      : null
  };
}

export async function getRentals() {
  if (!hasSupabase()) {
    return fallbackRentals.map(normalizeRental);
  }

  try {
    const rows = await supabaseRequest('rentals?select=*&order=created_at.desc');
    return rows.map(normalizeRental);
  } catch {
    return fallbackRentals.map(normalizeRental);
  }
}

export async function getRentalById(id) {
  const rentals = await getRentals();
  return rentals.find((item) => item.id === id) || null;
}

export async function getFeaturedRentals(limit = 3) {
  const rentals = await getRentals();
  return rentals.filter((item) => item.featured).slice(0, limit);
}

export async function getImports() {
  if (!hasSupabase()) {
    return fallbackImports.map(normalizeImport);
  }

  try {
    const rows = await supabaseRequest('imports?select=*&order=created_at.desc');
    return rows.map(normalizeImport);
  } catch {
    return fallbackImports.map(normalizeImport);
  }
}

export async function getFeaturedImports(limit = 3) {
  const imports = await getImports();
  return imports.filter((item) => item.featured).slice(0, limit);
}

export async function upsertRental(payload, accessToken) {
  const cleanPayload = cleanRentalPayload(payload);
  validateRentalPayload(cleanPayload);
  if (!hasSupabase()) {
    return normalizeRental(cleanPayload);
  }

  const rows = await supabaseRequest('rentals', {
    method: 'POST',
    body: cleanPayload,
    admin: true,
    token: accessToken
  });
  return normalizeRental(rows[0]);
}

export async function updateRental(id, payload, accessToken) {
  const cleanPayload = cleanRentalPayload(payload);
  validateRentalPayload(cleanPayload);
  if (!hasSupabase()) {
    return normalizeRental({ ...cleanPayload, id });
  }

  const rows = await supabaseRequest(`rentals?id=eq.${id}`, {
    method: 'PATCH',
    body: cleanPayload,
    admin: true,
    token: accessToken
  });
  return normalizeRental(rows[0]);
}

export async function deleteRental(id, accessToken) {
  if (!hasSupabase()) {
    return { success: true };
  }

  await supabaseRequest(`rentals?id=eq.${id}`, {
    method: 'DELETE',
    admin: true,
    token: accessToken
  });
  return { success: true };
}

export async function upsertImport(payload, accessToken) {
  const cleanPayload = cleanImportPayload(payload);
  validateImportPayload(cleanPayload);
  if (!hasSupabase()) {
    return normalizeImport(cleanPayload);
  }

  const rows = await supabaseRequest('imports', {
    method: 'POST',
    body: cleanPayload,
    admin: true,
    token: accessToken
  });
  return normalizeImport(rows[0]);
}

export async function updateImport(id, payload, accessToken) {
  const cleanPayload = cleanImportPayload(payload);
  validateImportPayload(cleanPayload);
  if (!hasSupabase()) {
    return normalizeImport({ ...cleanPayload, id });
  }

  const rows = await supabaseRequest(`imports?id=eq.${id}`, {
    method: 'PATCH',
    body: cleanPayload,
    admin: true,
    token: accessToken
  });
  return normalizeImport(rows[0]);
}

export async function deleteImport(id, accessToken) {
  if (!hasSupabase()) {
    return { success: true };
  }

  await supabaseRequest(`imports?id=eq.${id}`, {
    method: 'DELETE',
    admin: true,
    token: accessToken
  });
  return { success: true };
}

export async function getRentalRequests(accessToken) {
  if (!hasSupabase()) {
    return fallbackRentalRequests.map(normalizeRentalRequest);
  }

  const rows = await supabaseRequest('rental_requests?select=*&order=created_at.desc', {
    admin: true,
    token: accessToken
  });
  return rows.map(normalizeRentalRequest);
}

export async function createRentalRequest(payload) {
  const rentalId = String(payload.rental_id || payload.rentalId || '');
  const rental = rentalId ? await getRentalById(rentalId) : null;
  const cleanPayload = cleanRentalRequestPayload(payload, rental);

  if (!cleanPayload.rental_id || !cleanPayload.customer_name || !cleanPayload.customer_email || !cleanPayload.customer_phone || !cleanPayload.start_date || !cleanPayload.end_date) {
    throw new Error('Faltan datos requeridos para la solicitud.');
  }

  if (!rental || !rental.available) {
    throw new Error('El vehiculo no esta disponible.');
  }

  if (!isValidEmail(cleanPayload.customer_email)) {
    throw new Error('El correo no es valido.');
  }

  if (!isIsoDate(cleanPayload.start_date) || !isIsoDate(cleanPayload.end_date)) {
    throw new Error('Las fechas no son validas.');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (cleanPayload.start_date < today || cleanPayload.end_date < cleanPayload.start_date) {
    throw new Error('Selecciona un rango de fechas valido.');
  }

  if (cleanPayload.customer_name.length > 120 || cleanPayload.customer_email.length > 254 || cleanPayload.customer_phone.length > 40 || cleanPayload.notes.length > 2000) {
    throw new Error('Uno de los campos supera el limite permitido.');
  }

  if (!hasSupabase()) {
    return normalizeRentalRequest(cleanPayload);
  }

  await supabaseRequest('rental_requests', {
    method: 'POST',
    body: cleanPayload,
    returnRepresentation: false
  });
  return normalizeRentalRequest(cleanPayload);
}

export async function updateRentalRequest(id, payload, accessToken) {
  const allowedStatuses = new Set(['pendiente', 'confirmada', 'cancelada', 'completada']);
  const status = String(payload.status || '');
  if (!allowedStatuses.has(status)) {
    throw new Error('Estado de solicitud no valido.');
  }
  if (!hasSupabase()) {
    return normalizeRentalRequest({ status, id });
  }

  const rows = await supabaseRequest(`rental_requests?id=eq.${id}`, {
    method: 'PATCH',
    body: { status },
    admin: true,
    token: accessToken
  });
  return normalizeRentalRequest(rows[0]);
}

export async function deleteRentalRequest(id, accessToken) {
  if (!hasSupabase()) {
    return { success: true };
  }

  await supabaseRequest(`rental_requests?id=eq.${id}`, {
    method: 'DELETE',
    admin: true,
    token: accessToken
  });
  return { success: true };
}

export async function getDashboardSummary(accessToken) {
  const [rentals, imports, rentalRequests] = await Promise.all([getRentals(), getImports(), getRentalRequests(accessToken)]);
  return {
    rentalsTotal: rentals.length,
    rentalsAvailable: rentals.filter((item) => item.available).length,
    featuredRentals: rentals.filter((item) => item.featured).length,
    importsTotal: imports.length,
    importsDelivered: imports.filter((item) => item.status.toLowerCase() === 'entregado').length,
    importsInTransit: imports.filter((item) => item.status.toLowerCase() !== 'entregado').length,
    rentalRequestsTotal: rentalRequests.length,
    rentalRequestsPending: rentalRequests.filter((item) => item.status === 'pendiente').length,
    recentRentals: rentals.slice(0, 5),
    recentImports: imports.slice(0, 5),
    recentRentalRequests: rentalRequests.slice(0, 5)
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || value || 'N/D';
}

export function transmissionLabel(value) {
  return TRANSMISSION_LABELS[value] || value || 'N/D';
}

export function fuelLabel(value) {
  return FUEL_LABELS[value] || value || 'N/D';
}

export function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

export function getPublicConfig() {
  const cloudinaryCloudName = import.meta.env.CLOUDINARY_CLOUD_NAME || import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  const cloudinaryReady = Boolean(cloudinaryCloudName && import.meta.env.CLOUDINARY_API_KEY && import.meta.env.CLOUDINARY_API_SECRET);
  return {
    hasSupabase: hasSupabase(),
    cloudinaryCloudName: cloudinaryReady ? cloudinaryCloudName : ''
  };
}
