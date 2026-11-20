# Guía de uso

El usuario entra por `/login` con su correo y contraseña. Según su rol, el menú
superior muestra solo las pantallas que le corresponden; si abre una ruta de
otro rol se le lleva a `/sin-permiso` (“No tienes permiso para esta acción”).
Las credenciales de prueba se entregan por Moodle.

La descripción completa de cada flujo y sus reglas de negocio está en la
[guía de uso del backend](https://github.com/david-galdamez/gestion_condominios_backend_fresquitop/blob/develop/docs/01-guia-de-uso.md).

## Roles

| Rol | Pantallas |
|---|---|
| Residente | Inicio, Estado de cuenta (`/estado-cuenta`), Visitas (`/visitas`, `/visitas/nueva`, `/visitas/{id}/editar`), Mis reportes (`/reportes`, `/reportes/nuevo`, `/reportes/{numero}`), Comunicados (`/comunicados`, `/comunicados/{id}`). |
| Administrador | Inicio, Áreas comunes (`/admin/areas`, nueva y editar), Morosidad (`/admin/morosidad`), Comunicados (`/admin/comunicados`, `/admin/comunicados/nuevo`). |
| Seguridad | Inicio, Paquetes (`/porteria/paquetes`, `/porteria/paquetes/nuevo`). |

## Flujos principales

### Módulo 1: Cuotas y pagos de mantenimiento

#### Consultar el estado de cuenta (Residente)

1. Menú **Estado de cuenta**.
2. Elegir la unidad si tiene varias; ver saldo y cuotas (20 por página).
3. Filtrar por estado o fechas; sin resultados aparece “No hay cuotas para el periodo seleccionado”.

#### Consultar la morosidad (Administrador)

Menú **Morosidad**: total en mora, unidades morosas y vencida más antigua, con filtro por torre.

### Módulo 2: Reservas de áreas comunes

#### Configurar un área (Administrador)

Menú **Áreas comunes → Nueva área**: nombre, capacidad, horario y duración
máxima. En la lista se edita o se activa/desactiva cada área.

### Módulo 3: Incidencias y mantenimiento

#### Reportar un problema (Residente)

Menú **Mis reportes → Nuevo reporte**: título, categoría, ubicación,
descripción y hasta 5 fotos. El detalle muestra las fotos y el historial de estados.

### Módulo 4: Control de acceso de visitas

#### Pre-autorizar una visita (Residente)

1. Menú **Visitas → Nueva visita**.
2. Llenar el formulario (el DUI se enmascara como `00000000-0` al escribir).
3. Se muestra el código grande de 6 dígitos, “Válido solo el {fecha}” y el botón **Copiar código**.

#### Editar una visita (Residente)

1. En **Mis visitas**, botón **Editar** (solo en Vigentes).
2. El formulario se abre con los datos cargados y la unidad fija.
3. Al guardar se muestra el código; si se cambió la fecha aparece “se generó un código nuevo y el anterior dejó de funcionar”.

#### Cancelar una visita (Residente)

En **Mis visitas**, botón **Cancelar** y confirmar en el diálogo.

### Módulo 5: Paquetería

#### Registrar un paquete (Seguridad)

Menú **Paquetes → Registrar paquete**: unidad, destinatario, mensajería, guía
opcional y foto. La lista muestra los paquetes en portería y retenidos.

### Módulo 7: Anuncios y comunicados

#### Publicar o programar un comunicado (Administrador)

1. Menú **Comunicados → Nuevo comunicado**.
2. Título, contenido (con contador de caracteres), categoría y destinatarios (todo el condominio o casillas por torre).
3. La fecha de publicación viene en “ahora”: el botón dice **Publicar**. Con una fecha futura cambia a **Programar**. La expiración es opcional.
4. Confirmar “Se avisará a N torres. ¿Continuar?”. Se vuelve a la lista con el aviso “Comunicado publicado/programado”.

#### Ver mis comunicados (Residente, H14)

1. Menú **Comunicados**. Arriba a la derecha está el contador “N sin leer”; se actualiza al abrir la pantalla y cada 30 segundos.
2. La pestaña **Principal** lista los comunicados vigentes para todo el condominio y para la torre del residente, del más reciente al más antiguo, 20 por página. Los no leídos llevan un punto azul y la etiqueta “No leído”.
3. Al abrir un comunicado se ve su contenido y queda leído; el contador baja en 1.
4. La pestaña **Archivo** lista los comunicados expirados.
5. Si una pestaña está vacía se ve “No hay comunicados”. Un comunicado de otra torre abierto por enlace muestra “Comunicado no encontrado”.
