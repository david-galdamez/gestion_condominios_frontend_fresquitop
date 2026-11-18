# Problemas conocidos

| Problema | Cómo se reproduce | Impacto | Historia relacionada |
|---|---|---|---|
| No se usa el refresh token: cuando vence el access token (15 min) se pide iniciar sesión de nuevo. | Iniciar sesión, esperar más de 15 minutos y navegar. | Medio | — |
| `/directorio` y `/porteria/dentro` existen en el frontend, pero el backend aún no tiene sus endpoints y no aparecen en el menú. | Abrir esas rutas con sesión. | Medio | H16, H25 |
| El panel de salud del condominio (`/admin/panel`) no está implementado: depende de reservas y asambleas. | Abrir `/admin/panel` (404). | Medio | H19 |
| Los avisos de comunicados y paquetes no se muestran a los residentes: el servicio de notificaciones del backend es temporal. | Publicar un comunicado y entrar como residente. | Medio | H17, H18 |
| Advertencia de lint en `reportes/nuevo/reporte-form.tsx` por usar `window.location.assign` para navegar. | `npm run lint` | Bajo | H05 |
