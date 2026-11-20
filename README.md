# Gestión de Condominios — Frontend

Sistema web para administrar un condominio: estado de cuenta y morosidad,
control de acceso de visitas, paquetería, áreas comunes, incidencias y
comunicados. Los residentes, el administrador y el personal de seguridad
trabajan sobre la misma información, cada uno con los permisos de su rol.

Este repositorio contiene la **aplicación web** (Next.js 16, React 19, Tailwind 4).
La API está en
[gestion_condominios_backend_fresquitop](https://github.com/david-galdamez/gestion_condominios_backend_fresquitop),
donde vive también la documentación completa del sistema (modelo de datos, API,
despliegue del backend).

**Proyecto asignado:** Sistema de gestión de condominios · Ingeniería de Software 2026 · Equipo Fresquitop.

## Integrantes

| Integrante | Rol en el equipo | Historias |
|---|---|---|
| David Enrique Galdamez Menjivar | Desarrollador full stack | H01, H07, H07b, H13, H19 |
| Omar Ernesto Quintanilla Aguilar | Desarrollador full stack | H06, H12, H18, H22, H24 |
| Pablo Esteban Castellón Cerritos | Desarrollador full stack | H02, H08, H14, H20 |
| Jaime Jiménez | Desarrollador full stack | H03, H09, H15, H21, H23 |
| Edwin Guzmán | Desarrollador full stack | H04, H10, H16, H25 |
| Gabriel Aguilar | Desarrollador full stack | H05, H11, H17, H26, H27 |

## Despliegue

| Componente | URL |
|---|---|
| Frontend | Pendiente de despliegue |
| Backend (API) | Pendiente de despliegue |
| Swagger | `<url-del-backend>/api/docs` |

Tablero: <https://trello.com/b/taNV3ODs/condominiosfresquitop>

## Inicio rápido

```bash
cp .env.example .env   # API_URL=http://localhost:3000/api/v1
npm install
npm run dev            # http://localhost:3001
npm test
```

El backend debe estar corriendo; ver [Instalación local](docs/05-instalacion-local.md).

## Documentación

1. [Guía de uso](docs/01-guia-de-uso.md): roles, pantallas y flujos principales.
2. [Arquitectura](docs/02-arquitectura.md): cómo se comunica con la API, stack, carpetas y decisiones.
3. [Modelo de datos](docs/03-modelo-de-datos.md): tipos del frontend y enlace al diagrama ER.
4. [API](docs/04-api.md): autenticación y endpoints que consume cada módulo.
5. [Instalación local](docs/05-instalacion-local.md): requisitos, variables y pruebas.
6. [Despliegue](docs/06-despliegue.md): Vercel y publicación de versiones.
7. [Forma de trabajo](docs/07-forma-de-trabajo.md): Git Flow, commits y PR.
8. [Historias](docs/08-historias.md): estado de cada historia por módulo.
9. [Problemas conocidos](docs/09-problemas-conocidos.md).

```
gestion_condominios_frontend_fresquitop
├─ .node-version
├─ AGENTS.md
├─ app
│  ├─ (privado)
│  │  ├─ admin
│  │  │  ├─ areas
│  │  │  │  ├─ area-form.test.tsx
│  │  │  │  ├─ area-form.tsx
│  │  │  │  ├─ error.tsx
│  │  │  │  ├─ lista-areas.test.tsx
│  │  │  │  ├─ lista-areas.tsx
│  │  │  │  ├─ loading.tsx
│  │  │  │  ├─ nueva
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [id]
│  │  │  │     └─ editar
│  │  │  │        └─ page.tsx
│  │  │  ├─ asambleas
│  │  │  │  ├─ nuevo
│  │  │  │  │  ├─ asamblea-form.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ comunicados
│  │  │  │  ├─ lista-comunicados.tsx
│  │  │  │  ├─ nuevo
│  │  │  │  │  ├─ comunicado-form.test.tsx
│  │  │  │  │  ├─ comunicado-form.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ cuotas
│  │  │  │  ├─ configuracion-form.tsx
│  │  │  │  ├─ cuotas-forms.test.tsx
│  │  │  │  ├─ error.tsx
│  │  │  │  ├─ generar-form.tsx
│  │  │  │  ├─ loading.tsx
│  │  │  │  └─ page.tsx
│  │  │  └─ morosidad
│  │  │     ├─ error.tsx
│  │  │     ├─ filtros-form.test.tsx
│  │  │     ├─ filtros-form.tsx
│  │  │     ├─ leer-filtros.test.tsx
│  │  │     ├─ leer-filtros.tsx
│  │  │     ├─ loading.tsx
│  │  │     ├─ page.test.tsx
│  │  │     ├─ page.tsx
│  │  │     └─ reintentar-button.tsx
│  │  ├─ directorio
│  │  │  └─ mi-perfil
│  │  │     ├─ error.tsx
│  │  │     ├─ loading.tsx
│  │  │     ├─ page.tsx
│  │  │     ├─ perfil-form.test.tsx
│  │  │     ├─ perfil-form.tsx
│  │  │     └─ vista-previa.tsx
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
│  │  ├─ pagos
│  │  │  ├─ nuevo
│  │  │  │  ├─ error.tsx
│  │  │  │  ├─ loading.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  ├─ pago-form.test.tsx
│  │  │  │  └─ pago-form.tsx
│  │  │  └─ [numeroTransaccion]
│  │  │     └─ page.tsx
│  │  ├─ porteria
│  │  │  ├─ accesos
│  │  │  │  ├─ accesos.test.tsx
│  │  │  │  ├─ error.tsx
│  │  │  │  ├─ loading.tsx
│  │  │  │  ├─ nuevo
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ visitante-form.tsx
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ resultados.tsx
│  │  │  └─ paquetes
│  │  │     ├─ actualizar-button.tsx
│  │  │     ├─ error.tsx
│  │  │     ├─ lista-paquetes.test.tsx
│  │  │     ├─ lista-paquetes.tsx
│  │  │     ├─ loading.tsx
│  │  │     ├─ nuevo
│  │  │     │  ├─ page.tsx
│  │  │     │  ├─ paquete-form.test.tsx
│  │  │     │  └─ paquete-form.tsx
│  │  │     └─ page.tsx
│  │  ├─ reportes
│  │  │  ├─ loading.tsx
│  │  │  ├─ nuevo
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ reporte-form.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ [numero]
│  │  │     ├─ not-found.tsx
│  │  │     └─ page.tsx
│  │  ├─ sin-permiso
│  │  │  └─ page.tsx
│  │  └─ visitas
│  │     ├─ error.tsx
│  │     ├─ lista-visitas.test.tsx
│  │     ├─ lista-visitas.tsx
│  │     ├─ loading.tsx
│  │     ├─ nueva
│  │     │  ├─ error.tsx
│  │     │  ├─ loading.tsx
│  │     │  ├─ page.tsx
│  │     │  ├─ visita-form.test.tsx
│  │     │  └─ visita-form.tsx
│  │     ├─ page.tsx
│  │     └─ [id]
│  │        └─ editar
│  │           └─ page.tsx
│  ├─ actions
│  │  ├─ accesos.test.ts
│  │  ├─ accesos.ts
│  │  ├─ areas.test.ts
│  │  ├─ areas.ts
│  │  ├─ asambleas.ts
│  │  ├─ auth.ts
│  │  ├─ comunicados.test.ts
│  │  ├─ comunicados.ts
│  │  ├─ cuotas.test.ts
│  │  ├─ cuotas.ts
│  │  ├─ pagos.test.ts
│  │  ├─ pagos.ts
│  │  ├─ paquetes.test.ts
│  │  ├─ paquetes.ts
│  │  ├─ perfil-directorio.test.ts
│  │  ├─ perfil-directorio.ts
│  │  ├─ visitas.test.ts
│  │  └─ visitas.ts
│  ├─ api
│  │  ├─ reportes
│  │  │  ├─ route.ts
│  │  │  └─ [numero]
│  │  │     └─ fotos
│  │  │        └─ [fotoId]
│  │  │           └─ route.ts
│  │  └─ sesion
│  │     └─ expirada
│  │        └─ route.ts
│  ├─ directorio
│  │  └─ page.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ login
│  │  ├─ login-form.tsx
│  │  └─ page.tsx
│  └─ porteria
│     └─ dentro
│        └─ page.tsx
├─ CLAUDE.md
├─ components
│  ├─ copiar-boton.test.tsx
│  ├─ copiar-boton.tsx
│  ├─ estado-autorizacion-badge.test.tsx
│  ├─ estado-autorizacion-badge.tsx
│  ├─ estado-cuota-badge.test.tsx
│  ├─ estado-cuota-badge.tsx
│  ├─ estado-reporte-badge.tsx
│  └─ session-provider.tsx
├─ docs
│  ├─ 01-guia-de-uso.md
│  ├─ 02-arquitectura.md
│  ├─ 03-modelo-de-datos.md
│  ├─ 04-api.md
│  ├─ 05-instalacion-local.md
│  ├─ 06-despliegue.md
│  ├─ 07-forma-de-trabajo.md
│  ├─ 08-historias.md
│  └─ 09-problemas-conocidos.md
├─ eslint.config.mjs
├─ lib
│  ├─ accesos.ts
│  ├─ api.ts
│  ├─ areas.test.ts
│  ├─ areas.ts
│  ├─ asambleas.ts
│  ├─ auth.ts
│  ├─ comunicados.ts
│  ├─ cuotas.ts
│  ├─ estado-cuenta.test.ts
│  ├─ estado-cuenta.ts
│  ├─ format.test.ts
│  ├─ format.ts
│  ├─ morosidad.test.ts
│  ├─ morosidad.ts
│  ├─ pagos.test.ts
│  ├─ pagos.ts
│  ├─ paquetes.test.ts
│  ├─ paquetes.ts
│  ├─ perfil-directorio.test.ts
│  ├─ perfil-directorio.ts
│  ├─ reportes-ui.ts
│  ├─ reportes-validacion.test.ts
│  ├─ reportes-validacion.ts
│  ├─ reportes.ts
│  ├─ session.ts
│  ├─ stores
│  │  └─ session-store.ts
│  ├─ types
│  │  ├─ accesos.ts
│  │  ├─ areas.ts
│  │  ├─ asambleas.ts
│  │  ├─ comunicados.ts
│  │  ├─ cuotas.ts
│  │  ├─ estado-cuenta.ts
│  │  ├─ morosidad.ts
│  │  ├─ pagos.ts
│  │  ├─ paquetes.ts
│  │  ├─ perfil-directorio.ts
│  │  ├─ reportes.ts
│  │  └─ visitas.ts
│  ├─ validaciones
│  │  ├─ acceso.test.ts
│  │  ├─ acceso.ts
│  │  ├─ area.test.ts
│  │  ├─ area.ts
│  │  ├─ asamblea.ts
│  │  ├─ comunicado.test.ts
│  │  ├─ comunicado.ts
│  │  ├─ cuota.test.ts
│  │  ├─ cuota.ts
│  │  ├─ pago.test.ts
│  │  ├─ pago.ts
│  │  ├─ paquete.test.ts
│  │  ├─ paquete.ts
│  │  ├─ perfil-directorio.test.ts
│  │  ├─ perfil-directorio.ts
│  │  ├─ visita.test.ts
│  │  └─ visita.ts
│  ├─ visitas.test.ts
│  └─ visitas.ts
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