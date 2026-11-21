import { obtenerMetaModuloOrigen } from "@/lib/notificaciones-ui";
import type { ModuloOrigen } from "@/lib/types/notificaciones";

function ModuloOrigenIcono({ modulo }: { modulo: ModuloOrigen | null }) {
  const baseProps = {
    className: "h-3.5 w-3.5 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: "false" as const,
  };

  switch (modulo) {
    case "PAGOS":
      return (
        <svg {...baseProps} data-modulo-icono="PAGOS">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
          <path d="M6 15h4" />
        </svg>
      );
    case "RESERVAS":
      return (
        <svg {...baseProps} data-modulo-icono="RESERVAS">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      );
    case "INCIDENCIAS":
      return (
        <svg {...baseProps} data-modulo-icono="INCIDENCIAS">
          <path d="m10.29 3.86-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.71-3.14l-8-14a2 2 0 0 0-3.42 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "VISITAS":
      return (
        <svg {...baseProps} data-modulo-icono="VISITAS">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m16 11 2 2 4-4" />
        </svg>
      );
    case "PAQUETERIA":
      return (
        <svg {...baseProps} data-modulo-icono="PAQUETERIA">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      );
    case "VOTACIONES":
      return (
        <svg {...baseProps} data-modulo-icono="VOTACIONES">
          <path d="m9 12 2 2 4-4" />
          <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
          <path d="M22 19H2" />
        </svg>
      );
    case "COMUNICADOS":
      return (
        <svg {...baseProps} data-modulo-icono="COMUNICADOS">
          <path d="m3 11 18-5v12L3 13v-2Z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps} data-modulo-icono="FALLBACK">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
  }
}

export function ModuloOrigenBadge({
  moduloOrigen,
  className = "",
}: {
  moduloOrigen: ModuloOrigen | string;
  className?: string;
}) {
  const { modulo, etiqueta, clases } = obtenerMetaModuloOrigen(moduloOrigen);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${clases}${className ? ` ${className}` : ""}`}
    >
      <ModuloOrigenIcono modulo={modulo} />
      {etiqueta}
    </span>
  );
}