import { CATEGORIAS } from "@/lib/validaciones/comunicado";
import type { Comunicado, EstadoComunicado } from "@/lib/types/comunicados";

const ESTADO: Record<EstadoComunicado, { texto: string; clase: string }> = {
  PUBLICADO: {
    texto: "Publicado",
    clase: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  PROGRAMADO: {
    texto: "Programado",
    clase: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  EXPIRADO: {
    texto: "Expirado",
    clase: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

const fechaHora = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  dateStyle: "short",
  timeStyle: "short",
});

const categoria = (c: string) =>
  CATEGORIAS.find((x) => x.valor === c)?.etiqueta ?? c;

export function ListaComunicados({
  comunicados,
}: {
  comunicados: Comunicado[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="py-2 pr-4 font-medium">Título</th>
            <th className="py-2 pr-4 font-medium">Categoría</th>
            <th className="py-2 pr-4 font-medium">Destinatarios</th>
            <th className="py-2 pr-4 font-medium">Publicación</th>
            <th className="py-2 pr-4 font-medium">Expira</th>
            <th className="py-2 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {comunicados.map((c) => (
            <tr key={c.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4">{c.titulo}</td>
              <td className="py-2 pr-4">{categoria(c.categoria)}</td>
              <td className="py-2 pr-4">
                {c.paraTodos
                  ? "Todo el condominio"
                  : c.torres.map((t) => t.nombre).join(", ")}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {fechaHora.format(new Date(c.fechaPublicacion))}
              </td>
              <td className="py-2 pr-4 tabular-nums">
                {c.fechaExpiracion
                  ? fechaHora.format(new Date(c.fechaExpiracion))
                  : "—"}
              </td>
              <td className="py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${ESTADO[c.estado].clase}`}>
                  {ESTADO[c.estado].texto}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
