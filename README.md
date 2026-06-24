# Motor de Reservas

Plataforma de reservas para restaurantes: marketplace público, panel de host, CRM, campañas, integraciones POS y agente IA de reservas.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL** + **Prisma 7**
- **NextAuth v5** (credenciales + JWT)
- **Tailwind CSS 4**
- **Stripe**, **Resend**, **Twilio**, **Vercel AI SDK**

## Requisitos

- Node.js 20+
- Docker (PostgreSQL local)
- Copia `.env.example` a `.env` y ajusta variables

## Inicio rápido

```bash
npm install
npm run setup    # levanta Postgres, migra y seed
npm run dev      # http://localhost:3000
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run test` | Tests con Vitest |
| `npm run db:migrate` | Migraciones en desarrollo |
| `npm run db:seed` | Datos de prueba (demo + locales de ejemplo) |
| `npm run db:seed:venues` | Solo locales de ejemplo (sin usuarios demo) |
| `npm run up:detach` | Solo Postgres (Docker) |

## Locales de ejemplo

El archivo [`data/example-venues.json`](data/example-venues.json) contiene **309 locales** del catálogo editorial del proyecto El Travieso (listados World's 50 Best: restaurantes y coctelerías). Se importan al marketplace con `npm run db:seed` o `npm run db:seed:venues`.

Los locales aparecen en `/explore` aunque aún no tengan coordenadas en el mapa (geocodificación pendiente).

## Credenciales de demo (tras seed)

- **Staff:** `owner@demo.local` / `password123`
- **Comensal:** `diner@demo.local` / `password123`
- **Local demo:** [La Trattoria](/book/la-trattoria) (`/book/la-trattoria`)

## Guion de demo (5 min)

Tras `npm run setup` o `npm run db:seed`:

1. **Widget** — En la home, «Ver widget demo» → reserva para **mañana** a las 14:00 (teléfono opcional).
2. **Panel** — Login como `owner@demo.local` → **Host View** → cambia la fecha al día de la reserva.
3. **Ajustes** — Tab Operación: aforo global, intervalo de slots y límites por turno (Comida/Cena).
4. **Mapa de sala** — `/dashboard/floor-plan`: 8 mesas demo; edita nombre y capacidad al seleccionar una mesa.
5. **Integraciones** — Canales conectados (Google, TheFork, Square…), KPI arriba y reservas por canal en stats.

### Base de datos local

Si el puerto 5432 ya está ocupado (p. ej. contenedor `vermut-postgres`), apunta `DATABASE_URL` a esa instancia con base `motor_reservas` y ejecuta:

```bash
npx prisma db push
npm run db:seed
```

## Variables de entorno

Ver [`.env.example`](.env.example) para la lista completa.
