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
