# Modelo de datos

El frontend no tiene base de datos propia: todo se lee y escribe a través de la
API. El diagrama entidad-relación y la descripción de cada tabla están en la
[documentación del backend](https://github.com/david-galdamez/gestion_condominios_backend_fresquitop/blob/develop/docs/03-modelo-de-datos.md).

## Tipos que usa el frontend

Los tipos de `lib/types/` reflejan las respuestas de la API:

| Archivo | Tipos | Tabla de origen |
|---|---|---|
| `estado-cuenta.ts` | Estado de cuenta, cuota, estado de cuota | `cuota`, `unidad` |
| `visitas.ts` | `Autorizacion`, `NuevaAutorizacion`, `CambiosAutorizacion`, `UnidadMia` | `autorizacion_visita`, `unidad` |
| `areas.ts` | `Area`, `DatosArea` | `area_comun` |
| `paquetes.ts` | Paquete en portería, mensajería | `paquete` |
| `reportes.ts` | Reporte, evidencia, historial | `reporte`, `evidencia_reporte`, `historial_reporte` |
| `morosidad.ts` | Unidad morosa y resumen | `cuota`, `unidad` |
| `comunicados.ts` | `Comunicado`, `NuevoComunicado`, `Torre` | `comunicado`, `comunicado_destino`, `torre` |

En la sesión se guarda el usuario (`id`, `email`, `nombre`, `rol`) en una
cookie httpOnly junto con el access token.
