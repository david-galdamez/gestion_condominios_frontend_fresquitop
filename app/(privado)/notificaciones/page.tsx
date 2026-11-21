import { ModuloOrigenBadge } from "@/components/modulo-origen-badge";
import { requireRol } from "@/lib/auth";
import { getNotificaciones } from "@/lib/notificaciones";
import Link from "next/link";

export default async function NotificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  await requireRol("RESIDENTE");
  const { pagina } = await searchParams;
  const p = parseInt(pagina ?? "1", 10) || 1;
  const data = await getNotificaciones(p);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Centro de Notificaciones</h1>

      {data.datos.length === 0 ? (
        <p className="text-zinc-500">No tienes avisos</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.datos.map((n) => (
              <Link
                key={n.id}
                href={n.referencia || "#"}
                className={`rounded-md border p-4 transition ${
                  n.leida
                    ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    : "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">{n.titulo}</p>
                    <p className="text-sm text-zinc-600 break-words dark:text-zinc-400">
                      {n.mensaje}
                    </p>
                  </div>
                  <ModuloOrigenBadge
                    moduloOrigen={n.moduloOrigen}
                    className="self-start"
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {new Date(n.createdAt).toLocaleString("es-SV")}
                </p>
              </Link>
            ))}
          </div>

          <div className="flex justify-between">
            <Link
              href={`/notificaciones?pagina=${p - 1}`}
              className={`text-sm ${p <= 1 ? "pointer-events-none opacity-50" : "underline"}`}
            >
              Anterior
            </Link>
            <span className="text-sm">
              Página {p} de {data.totalPaginas}
            </span>
            <Link
              href={`/notificaciones?pagina=${p + 1}`}
              className={`text-sm ${p >= data.totalPaginas ? "pointer-events-none opacity-50" : "underline"}`}
            >
              Siguiente
            </Link>
          </div>
        </>
      )}
    </div>
  );
}