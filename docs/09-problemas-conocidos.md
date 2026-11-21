# Problemas conocidos

| Problema | Cómo se reproduce | Impacto | Historia relacionada |
|---|---|---|---|
| No se usa el refresh token: cuando vence el access token (15 min) se pide iniciar sesión de nuevo. | Iniciar sesión, esperar más de 15 minutos y navegar. | Medio | — |
| `/porteria/dentro` existe en el frontend, pero el backend aún no tiene su endpoint y no aparece en el menú. (`/directorio` se resolvió en el hotfix 1.0.1.) | Abrir esa ruta con sesión. | Medio | H25 |
| A 360 px el encabezado común (`app/(privado)/layout.tsx`) se desborda: la página queda en ~428 px de ancho, “Cerrar sesión” se corta y los diálogos fijos se salen por la derecha. | Abrir cualquier pantalla con sesión a 360 px. | Medio | — |
| Los avisos de comunicados y paquetes no se muestran a los residentes: el servicio de notificaciones del backend es temporal. | Publicar un comunicado y entrar como residente. | Medio | H17, H18 |
| Advertencia de lint en `reportes/nuevo/reporte-form.tsx` por usar `window.location.assign` para navegar. | `npm run lint` | Bajo | H05 |
