# Alex Renta Cars

Sitio web y panel administrativo para publicar vehículos de alquiler, mostrar casos de importación y gestionar solicitudes de renta.

## Tecnología

- Astro 5 con renderizado SSR
- Vercel
- Supabase Database y Auth
- Cloudinary opcional para subir imágenes
- EmailJS para el formulario de contacto

## Desarrollo local

```sh
npm install
cp .env.example .env.local
npm run dev
```

Completa `.env.local` con los valores del proyecto. El archivo está ignorado por Git y nunca debe subirse.

## Variables

Obligatorias:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`

Opcionales:

- `SUPABASE_SERVICE_ROLE_KEY`: solo para el script de creación de administradores
- `ADMIN_USERS_JSON`: lista utilizada por `npm run seed:admins`
- `CLOUDINARY_CLOUD_NAME`
- `PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

El `service role` y los secretos de Cloudinary son exclusivamente de servidor. Nunca deben usar el prefijo `PUBLIC_`.

## Rutas principales

- `/`: inicio
- `/catalogo`: catálogo y filtros
- `/catalogo/:id`: detalle y solicitud de renta
- `/importaciones`: importaciones publicadas
- `/contacto`: contacto
- `/admin/login`: acceso administrativo
- `/admin/dashboard`: resumen
- `/admin/carros`: gestión de flota
- `/admin/reservas`: gestión de importaciones
- `/admin/solicitudes`: gestión de solicitudes

## Base de datos

El esquema reproducible está en `supabase-schema.sql`. Todas las tablas públicas tienen RLS habilitado. El público únicamente puede leer flota/importaciones y crear solicitudes pendientes; las operaciones administrativas exigen un usuario con `app_metadata.role = "admin"`.

Para crear administradores de forma segura, exporta las variables del servidor y ejecuta:

```sh
npm run seed:admins
```

No guardes contraseñas dentro del repositorio.

## Verificación y despliegue

```sh
npm run build
```

La rama `master` está conectada al proyecto `alex-renta-cars` en Vercel. Un push a esa rama crea un despliegue de producción.
