import { CATEGORIAS } from "@/lib/validaciones/comunicado";

const fechaHora = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  dateStyle: "short",
  timeStyle: "short",
});

export const etiquetaCategoria = (c: string) =>
  CATEGORIAS.find((x) => x.valor === c)?.etiqueta ?? c;

// ISO -> "20/11/26, 9:00" en la hora de El Salvador.
export function formatFechaHoraSv(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fechaHora.format(d);
}

export type PestanaComunicados = { archivo: boolean; pagina: number };

// Lee ?archivo=true&pagina=N; cualquier otro valor cae en la pestaña principal, página 1.
export function leerPestana(sp: {
  [k: string]: string | string[] | undefined;
}): PestanaComunicados {
  const pagina = Number(sp.pagina);
  return {
    archivo: sp.archivo === "true",
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
  };
}

export function hrefPestana({ archivo, pagina }: PestanaComunicados) {
  const q = new URLSearchParams();
  if (archivo) q.set("archivo", "true");
  if (pagina > 1) q.set("pagina", String(pagina));
  const s = q.toString();
  return s ? `/comunicados?${s}` : "/comunicados";
}
