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
| `npm run db:seed` | Datos de prueba |
| `npm run up:detach` | Solo Postgres (Docker) |

## Credenciales de demo (tras seed)

- **Staff:** `owner@demo.local` / `password123`
- **Comensal:** `diner@demo.local` / `password123`

## Variables de entorno

Ver [`.env.example`](.env.example) para la lista completa.
