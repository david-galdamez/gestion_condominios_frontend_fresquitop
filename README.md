This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configuración

Copia `.env.example` a `.env`:

```
API_URL=http://localhost:3000/api/v1
```

El backend (NestJS) corre en el puerto 3000 con prefijo `/api/v1`; el frontend
se fija en el puerto **3001**.

```bash
npm run dev    # http://localhost:3001
npm run build && npm start
```

Pendiente: refresh token (hoy solo se guarda el access token en cookie httpOnly).

## Pruebas

Vitest + Testing Library (jsdom). Los tests viven junto al código (`*.test.ts(x)`).

```bash
npm test          # una corrida
npm run test:watch
```

`server-only` se resuelve a un módulo vacío (`test/server-only.ts`); `next/navigation`
y `lib/api` se mockean con `vi.mock` en cada test.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```
gestion_condominios_frontend_fresquitop
├─ AGENTS.md
├─ app
│  ├─ (privado)
│  │  ├─ estado-cuenta
│  │  │  ├─ error.tsx
│  │  │  ├─ filtros-form.test.tsx
│  │  │  ├─ filtros-form.tsx
│  │  │  ├─ leer-filtros.test.ts
│  │  │  ├─ leer-filtros.ts
│  │  │  ├─ loading.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ reintentar-button.tsx
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ sin-permiso
│  │     └─ page.tsx
│  ├─ actions
│  │  └─ auth.ts
│  ├─ api
│  │  └─ sesion
│  │     └─ expirada
│  │        └─ route.ts
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ login
│     ├─ login-form.tsx
│     └─ page.tsx
├─ CLAUDE.md
├─ components
│  ├─ estado-cuota-badge.test.tsx
│  ├─ estado-cuota-badge.tsx
│  └─ session-provider.tsx
├─ eslint.config.mjs
├─ lib
│  ├─ api.ts
│  ├─ auth.ts
│  ├─ estado-cuenta.test.ts
│  ├─ estado-cuenta.ts
│  ├─ format.test.ts
│  ├─ format.ts
│  ├─ session.ts
│  ├─ stores
│  │  └─ session-store.ts
│  └─ types
│     └─ estado-cuenta.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ proxy.ts
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ test
│  └─ server-only.ts
├─ tsconfig.json
├─ vitest.config.mts
└─ vitest.setup.ts

```