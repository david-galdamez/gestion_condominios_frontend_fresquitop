import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Directorio de vecinos",
  description: "Busca vecinos que han decidido aparecer en el directorio.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SearchParams = {
  q?: string;
  pagina?: string;
};

type Contacto = {
  nombre: string | null;
  unidad: string | null;
  telefono: string | null;
  correo: string | null;
};

type DirectorioResponse = {
  datos: Contacto[];
  total: number;
  pagina: number;
};

function normalizarPagina(value?: string) {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function construirUrl(q: string, pagina: number) {
  const params = new URLSearchParams({ q, pagina: String(pagina) });
  return `/directorio?${params.toString()}`;
}

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.rol !== "RESIDENTE") {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h1 className="text-xl font-semibold">No tienes permiso para esta acción</h1>
          <p className="mt-2 text-sm">El directorio de vecinos está disponible únicamente para residentes.</p>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const pagina = normalizarPagina(params.pagina);

  let datos: Contacto[] = [];
  let total = 0;
  let paginaActual = pagina;
  let error = "";
  let busquedaRealizada = false;

  if (q.length > 0 && q.length < 2) {
    error = "Escribe al menos 2 caracteres";
  } else if (q.length > 60) {
    error = "La búsqueda no puede superar los 60 caracteres.";
  } else if (q.length >= 2) {
    busquedaRealizada = true;
    const query = new URLSearchParams({ q, pagina: String(pagina) });
    const response = await apiFetch(`directorio?${query.toString()}`);

    if (response.status === 403) {
      error = "No tienes permiso para esta acción";
    } else if (response.status === 400) {
      error = "La búsqueda no es válida. Escribe entre 2 y 60 caracteres.";
    } else if (!response.ok) {
      error = "No pudimos cargar el directorio. Intenta de nuevo.";
    } else {
      const result = (await response.json()) as DirectorioResponse;
      datos = Array.isArray(result.datos) ? result.datos : [];
      total = Number.isFinite(result.total) ? result.total : datos.length;
      paginaActual = Number.isInteger(result.pagina) && result.pagina >= 1 ? result.pagina : pagina;
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-700">Comunidad</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">Directorio de vecinos</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Busca por nombre o por unidad. Cada vecino aparece únicamente con los datos que autorizó mostrar.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form action="/directorio" method="get" className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="q" className="sr-only">Nombre o unidad del vecino</label>
          <input
            id="q"
            name="q"
            type="search"
            minLength={2}
            maxLength={60}
            defaultValue={q}
            placeholder="Ej. jose o A-101"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input type="hidden" name="pagina" value="1" />
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Buscar vecinos
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">Escribe de 2 a 60 caracteres. La búsqueda no distingue mayúsculas ni acentos.</p>
      </section>

      {error ? (
        <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {busquedaRealizada && !error ? (
        <section className="mt-8" aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">Resultados de búsqueda</h2>
            <p className="text-sm text-zinc-500">{total} {total === 1 ? "vecino encontrado" : "vecinos encontrados"}</p>
          </div>

          {datos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
              <h3 className="font-semibold text-zinc-800">No encontramos vecinos con ese nombre o unidad</h3>
              <p className="mt-1 text-sm text-zinc-500">Prueba con otro nombre o número de unidad.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {datos.map((contacto, index) => (
                <article key={`${contacto.nombre ?? "vecino"}-${contacto.unidad ?? "sin-unidad"}-${index}`} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700" aria-hidden="true">
                    {(contacto.nombre?.trim().charAt(0) || "V").toUpperCase()}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">{contacto.nombre || "Vecino"}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    {contacto.unidad ? (
                      <div className="flex gap-2"><dt className="font-medium text-zinc-500">Unidad:</dt><dd className="text-zinc-800">{contacto.unidad}</dd></div>
                    ) : null}
                    {contacto.telefono ? (
                      <div className="flex gap-2"><dt className="font-medium text-zinc-500">Teléfono:</dt><dd><a className="text-blue-700 hover:underline" href={`tel:${contacto.telefono}`}>{contacto.telefono}</a></dd></div>
                    ) : null}
                    {contacto.correo ? (
                      <div className="flex gap-2 break-all"><dt className="shrink-0 font-medium text-zinc-500">Correo:</dt><dd><a className="text-blue-700 hover:underline" href={`mailto:${contacto.correo}`}>{contacto.correo}</a></dd></div>
                    ) : null}
                  </dl>
                  {!contacto.unidad && !contacto.telefono && !contacto.correo ? (
                    <p className="mt-3 text-sm text-zinc-500">Este vecino no autorizó mostrar más datos de contacto.</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {totalPaginas > 1 ? (
            <nav aria-label="Paginación del directorio" className="mt-6 flex items-center justify-between gap-3">
              {paginaActual > 1 ? (
                <Link href={construirUrl(q, paginaActual - 1)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Página anterior
                </Link>
              ) : <span />}
              <span className="text-sm text-zinc-600">Página {paginaActual} de {totalPaginas}</span>
              {paginaActual < totalPaginas ? (
                <Link href={construirUrl(q, paginaActual + 1)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Página siguiente
                </Link>
              ) : <span />}
            </nav>
          ) : null}
        </section>
      ) : !error ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
          Escribe el nombre de un vecino o una unidad para comenzar la búsqueda.
        </div>
      ) : null}
    </main>
  );
}
