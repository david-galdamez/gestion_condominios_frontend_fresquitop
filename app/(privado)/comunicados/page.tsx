import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import {
  MIS_COMUNICADOS_POR_PAGINA,
  getConteoNoLeidos,
  getMisComunicados,
} from "@/lib/comunicados";
import { hrefPestana, leerPestana } from "@/lib/comunicados-ui";
import { ReintentarButton } from "../estado-cuenta/reintentar-button";
import { ContadorNoLeidos } from "./contador-no-leidos";
import { ListaMisComunicados } from "./lista-mis-comunicados";

export const metadata: Metadata = { title: "Comunicados" };

const btnPag =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700";
const btnPagOff = `${btnPag} cursor-not-allowed opacity-50`;
const tab = "-mb-px border-b-2 px-3 py-2 text-sm";
const tabActiva = `${tab} border-foreground font-medium`;
const tabInactiva = `${tab} border-transparent text-zinc-600 hover:text-foreground dark:text-zinc-400`;

export default async function MisComunicadosPage({
  searchParams,
}: PageProps<"/comunicados">) {
  await requireRol("RESIDENTE");
  const { archivo, pagina } = leerPestana(await searchParams);
  const [r, conteo] = await Promise.all([
    getMisComunicados({ archivo, pagina }),
    getConteoNoLeidos(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Comunicados</h1>
        <ContadorNoLeidos inicial={conteo.status === "ok" ? conteo.data : null} />
      </div>

      <nav
        aria-label="Pestañas de comunicados"
        className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800"
      >
        <Link
          href={hrefPestana({ archivo: false, pagina: 1 })}
          aria-current={archivo ? undefined : "page"}
          className={archivo ? tabInactiva : tabActiva}
        >
          Principal
        </Link>
        <Link
          href={hrefPestana({ archivo: true, pagina: 1 })}
          aria-current={archivo ? "page" : undefined}
          className={archivo ? tabActiva : tabInactiva}
        >
          Archivo
        </Link>
      </nav>

      {r.status !== "ok" ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert">No pudimos cargar los comunicados. Intenta de nuevo.</p>
          <ReintentarButton />
        </div>
      ) : r.data.datos.length === 0 ? (
        <p className="py-8 text-center text-zinc-600 dark:text-zinc-400">
          No hay comunicados
        </p>
      ) : (
        <>
          <ListaMisComunicados comunicados={r.data.datos} />
          <Paginacion
            archivo={archivo}
            pagina={pagina}
            total={r.data.total}
            enPagina={r.data.datos.length}
          />
        </>
      )}
    </div>
  );
}

function Paginacion({
  archivo,
  pagina,
  total,
  enPagina,
}: {
  archivo: boolean;
  pagina: number;
  total: number;
  enPagina: number;
}) {
  if (pagina === 1 && total <= MIS_COMUNICADOS_POR_PAGINA) return null;
  const desde = (pagina - 1) * MIS_COMUNICADOS_POR_PAGINA + 1;
  const hasta = desde + enPagina - 1;
  const hayAnterior = pagina > 1;
  const haySiguiente = pagina * MIS_COMUNICADOS_POR_PAGINA < total;

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 text-sm"
    >
      <span className="text-zinc-600 dark:text-zinc-400">
        Mostrando {desde}–{hasta} de {total}
      </span>
      <div className="flex gap-2">
        {hayAnterior ? (
          <Link href={hrefPestana({ archivo, pagina: pagina - 1 })} className={btnPag}>
            Anterior
          </Link>
        ) : (
          <span aria-disabled="true" className={btnPagOff}>
            Anterior
          </span>
        )}
        {haySiguiente ? (
          <Link href={hrefPestana({ archivo, pagina: pagina + 1 })} className={btnPag}>
            Siguiente
          </Link>
        ) : (
          <span aria-disabled="true" className={btnPagOff}>
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}
