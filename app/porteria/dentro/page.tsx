import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Visitantes dentro",
  description: "Consulta los visitantes que permanecen dentro del condominio.",
};

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SearchParams = {
  unidadId?: string;
};

type VisitanteDentro = {
  id: string;
  nombre: string;
  documento: string;
  unidad: string;
  motivo: string;
  horaEntrada: string;
  preautorizado: boolean;
};

type VisitantesResponse = {
  datos: VisitanteDentro[];
  total: number;
  consultadoEn: string;
};

function fechaHora(value?: string) {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/El_Salvador",
  }).format(date);
}

async function registrarSalida(formData: FormData) {
  "use server";

  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.rol !== "SEGURIDAD") {
    throw new Error("No tienes permiso para registrar salidas.");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("No se recibió el identificador del registro de acceso.");

  const response = await apiFetch(`accesos/${encodeURIComponent(id)}/salida`, {
    method: "PATCH",
  });

  if (response.status === 409) {
    throw new Error("Este visitante ya registró su salida.");
  }
  if (!response.ok) {
    throw new Error(`No se pudo registrar la salida (HTTP ${response.status}).`);
  }

  revalidatePath("/porteria/dentro");
}

export default async function VisitantesDentroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (user.rol !== "SEGURIDAD") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h1 className="text-xl font-semibold">No tienes permiso para esta acción</h1>
          <p className="mt-2 text-sm">La lista de visitantes dentro está disponible únicamente para personal de seguridad.</p>
        </section>
      </main>
    );
  }

  const params = await searchParams;
  const unidadId = (params.unidadId ?? "").trim();
  let datos: VisitanteDentro[] = [];
  let total = 0;
  let consultadoEn = "";
  let error = "";

  if (unidadId && !UUID_REGEX.test(unidadId)) {
    error = "El identificador de unidad debe ser un UUID válido.";
  } else {
    const query = new URLSearchParams();
    if (unidadId) query.set("unidadId", unidadId);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    const response = await apiFetch(`accesos/dentro${suffix}`);

    if (response.status === 403) {
      error = "No tienes permiso para esta acción";
    } else if (response.status === 400) {
      error = "El filtro de unidad no es válido.";
    } else if (!response.ok) {
      error = "No pudimos cargar la lista. Intenta de nuevo.";
    } else {
      const result = (await response.json()) as VisitantesResponse;
      datos = Array.isArray(result.datos) ? result.datos : [];
      total = Number.isFinite(result.total) ? result.total : datos.length;
      consultadoEn = result.consultadoEn ?? "";
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* La historia solicita actualizar la lista cada 30 segundos. */}
      <meta httpEquiv="refresh" content="30" />

      <header className="mb-8">
        <p className="text-sm font-medium text-blue-700">Control de acceso</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">Visitantes dentro</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Consulta quién permanece dentro del condominio y a qué unidad se dirige.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form action="/porteria/dentro" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="unidadId" className="mb-1 block text-sm font-medium text-zinc-700">Filtrar por unidad</label>
            <input
              id="unidadId"
              name="unidadId"
              type="text"
              defaultValue={unidadId}
              placeholder="UUID de la unidad (vacío = todas)"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-zinc-500">El endpoint definido para H25 recibe el identificador UUID de la unidad.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
              Aplicar filtro
            </button>
            <a href="/porteria/dentro" className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Todas
            </a>
            <button type="submit" formAction="/porteria/dentro" className="rounded-lg border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Actualizar
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : null}

      {!error ? (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-zinc-900">Visitantes registrados</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {consultadoEn ? `Actualizado a las ${fechaHora(consultadoEn)}` : "Actualizando automáticamente cada 30 segundos"}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
              {total} {total === 1 ? "visitante" : "visitantes"}
            </span>
          </div>

          {datos.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-semibold text-zinc-800">No hay visitantes dentro</h3>
              <p className="mt-1 text-sm text-zinc-500">Cuando se registre una nueva entrada, aparecerá en esta lista.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Visitante</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Documento</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Unidad</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Motivo</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Hora de entrada</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Pre-autorizado</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {datos.map((visitante) => (
                    <tr key={visitante.id} className="align-top hover:bg-zinc-50">
                      <td className="px-5 py-4 font-medium text-zinc-900">{visitante.nombre}</td>
                      <td className="px-5 py-4 text-zinc-600">{visitante.documento}</td>
                      <td className="px-5 py-4 text-zinc-600">{visitante.unidad}</td>
                      <td className="px-5 py-4 text-zinc-600">{visitante.preautorizado ? "Visita pre-autorizada" : visitante.motivo}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-zinc-600">{fechaHora(visitante.horaEntrada)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${visitante.preautorizado ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-700"}`}>
                          {visitante.preautorizado ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <form action={registrarSalida}>
                          <input type="hidden" name="id" value={visitante.id} />
                          <button type="submit" className="whitespace-nowrap rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700">
                            Registrar salida
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
