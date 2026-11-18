import type { Metadata } from "next";
import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { getMiPerfil } from "@/lib/perfil-directorio";
import { ReintentarButton } from "../../estado-cuenta/reintentar-button";
import { PerfilForm } from "./perfil-form";

export const metadata: Metadata = { title: "Mi perfil de directorio" };

export default async function MiPerfilDirectorioPage() {
  await requireRol("RESIDENTE");
  const r = await getMiPerfil();

  const titulo = <h1 className="text-2xl font-semibold">Mi perfil de directorio</h1>;

  if (r.status === "forbidden") {
    return (
      <div className="flex flex-col gap-2">
        {titulo}
        <p role="alert">No tienes permiso para esta acción</p>
      </div>
    );
  }

  if (r.status !== "ok") {
    return (
      <div className="flex flex-col items-start gap-3">
        {titulo}
        <p role="alert">No pudimos cargar tu perfil. Intenta de nuevo.</p>
        <ReintentarButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {titulo}
        <Link href="/directorio" className="text-sm underline">
          Buscar vecinos
        </Link>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400">
        Tú decides si apareces y qué datos ven tus vecinos. Al registrarte
        apareces como oculto.
      </p>
      <PerfilForm perfil={r.data} />
    </div>
  );
}
