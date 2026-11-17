# Despliegue

> Estado: el sistema todavía no está desplegado. Se completarán las URL cuando
> se publique la versión 1.0.0.

## Dónde está desplegado

| Componente | Plataforma | URL | Rama |
|---|---|---|---|
| Frontend | Vercel | Pendiente | main |
| Backend | Render | Pendiente | main |
| Base de datos | Neon | (privada) | |

El detalle del backend y la base de datos está en el
[despliegue del backend](https://github.com/david-galdamez/gestion_condominios_backend_fresquitop/blob/develop/docs/06-despliegue.md).

## Cómo se publica una nueva versión

1. Crear `release/X.Y.Z` desde `develop`, ajustar la versión de `package.json`.
2. PR de `release/X.Y.Z` hacia `main`, aprobado por otro integrante; después fusionar la release de vuelta a `develop`.
3. Etiquetar `vX.Y.Z` en GitHub → Releases (el backend lleva su propia release).
4. Vercel construye (`next build`) y publica automáticamente al detectar el cambio en `main`.
5. Correcciones en producción: `hotfix/<descripcion>` desde `main`, a `main` y `develop`, subiendo la versión de parche.

## Variables de entorno en producción

| Variable | Dónde se configura |
|---|---|
| `API_URL` | Vercel → Project Settings → Environment Variables (URL HTTPS del backend con `/api/v1`) |
| `NODE_ENV` | La define Vercel (`production`); activa cookies `secure` |
