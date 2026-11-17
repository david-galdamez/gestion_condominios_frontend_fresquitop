# Instalación local

## Requisitos

- Node.js 24 (ver `.node-version`) y npm.
- El backend corriendo (por defecto en <http://localhost:3000>). Se levanta con
  docker-compose siguiendo la
  [instalación local del backend](https://github.com/david-galdamez/gestion_condominios_backend_fresquitop/blob/develop/docs/05-instalacion-local.md),
  que también carga los datos semilla.

## Pasos

1. Clonar el repositorio.
2. Copiar el archivo de variables: `cp .env.example .env` y ajustar `API_URL` si el backend no está en el puerto 3000.
3. Instalar dependencias: `npm install`
4. Levantar el backend y su base de datos (`docker compose up -d` en el repositorio del backend) y cargar los datos semilla (`npm run db:seed` en el backend).
5. Arrancar el frontend: `npm run dev`
6. Abrir <http://localhost:3001> e iniciar sesión con un usuario de prueba.

Para una versión de producción local: `npm run build && npm start`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_URL` | URL base de la API, con el prefijo `/api/v1` | `http://localhost:3000/api/v1` |

## Pruebas automatizadas

```
npm test           # una corrida
npm run test:watch
npm run lint
```

Vitest + Testing Library con jsdom. Las pruebas viven junto al código como
`*.test.ts` o `*.test.tsx`. `server-only` se resuelve a un módulo vacío
(`test/server-only.ts`); `next/navigation`, `next/cache`, `lib/*` y las Server
Actions se mockean con `vi.mock` en cada prueba.
