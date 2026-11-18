# API

**Documentación interactiva (Swagger):** `https://<url-del-backend>/api/docs`
(pendiente de despliegue; en local <http://localhost:3000/api/docs>).

El resumen de endpoints por módulo y sus roles está en la
[documentación de la API del backend](https://github.com/david-galdamez/gestion_condominios_backend_fresquitop/blob/develop/docs/04-api.md).

## Autenticación

1. `app/login` envía correo y contraseña a la Server Action `login`, que llama a `POST /api/v1/auth/login`.
2. El access token y el usuario se guardan en cookies httpOnly (`session` y `session_user`).
3. `lib/api.ts` (`apiFetch`) agrega `Authorization: Bearer <token>` a cada petición al backend.
4. Si la API responde 401 (token vencido o inválido), se redirige a `/api/sesion/expirada`, que borra las cookies y lleva a `/login`.
5. `proxy.ts` redirige a `/login` cualquier ruta privada sin cookie, y `requireRol()` valida el rol en cada página.

## Endpoints que consume el frontend por módulo

### Módulo 1: Cuotas y pagos de mantenimiento

| Método | Ruta | Desde | Roles |
|---|---|---|---|
| GET | /api/v1/estado-cuenta | `lib/estado-cuenta.ts` | Residente |
| GET | /api/v1/admin/morosidad | `lib/morosidad.ts` | Administrador |

### Módulo 2: Reservas de áreas comunes

| Método | Ruta | Desde | Roles |
|---|---|---|---|
| GET, POST | /api/v1/areas | `lib/areas.ts` | Administrador |
| PUT | /api/v1/areas/{id} | `lib/areas.ts` | Administrador |
| PATCH | /api/v1/areas/{id}/estado | `lib/areas.ts` | Administrador |

### Módulo 3: Incidencias y mantenimiento

| Método | Ruta | Desde | Roles |
|---|---|---|---|
| GET, POST | /api/v1/reportes | `lib/reportes.ts`, `app/api/reportes` | Residente |
| GET | /api/v1/reportes/ubicaciones | `lib/reportes.ts` | Residente |
| GET | /api/v1/reportes/{numero} y sus fotos | `lib/reportes.ts`, `app/api/reportes/[numero]/fotos` | Residente |

### Módulo 4: Control de acceso de visitas

| Método | Ruta | Desde | Roles |
|---|---|---|---|
| GET | /api/v1/unidades/mias | `lib/visitas.ts` | Residente |
| POST | /api/v1/autorizaciones | `lib/visitas.ts` | Residente |
| GET | /api/v1/autorizaciones/mias | `lib/visitas.ts` | Residente |
| GET, PATCH | /api/v1/autorizaciones/{id} | `lib/visitas.ts` | Residente |
| PATCH | /api/v1/autorizaciones/{id}/cancelar | `lib/visitas.ts` | Residente |

### Módulo 5: Paquetería

| Método | Ruta | Desde | Roles |
|---|---|---|---|
| GET | /api/v1/unidades | `lib/paquetes.ts` | Seguridad |
| GET, POST | /api/v1/paquetes | `lib/paquetes.ts` | Seguridad |

### Módulo 7: Anuncios y comunicados

| Método | Ruta | Desde | Roles |
|---|---|---|---|
| GET | /api/v1/torres | `lib/comunicados.ts` | Administrador |
| GET, POST | /api/v1/comunicados | `lib/comunicados.ts` | Administrador |
