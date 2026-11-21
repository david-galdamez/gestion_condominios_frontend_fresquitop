import type { DatosDirectorio } from "@/lib/types/perfil-directorio";
import { DATOS } from "@/lib/validaciones/perfil-directorio";

type Props = {
  // null = oculto.
  vista: DatosDirectorio | null;
  // Para distinguir "no se muestra" de "no registrado".
  marcados: Record<string, boolean>;
};

// FE-15.2: así te ven los vecinos. Solo los datos marcados.
export function VistaPrevia({ vista, marcados }: Props) {
  return (
    <section
      aria-label="Vista previa"
      className="flex w-full max-w-xs flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Así te ven tus vecinos
      </h2>
      {vista === null ? (
        <p data-testid="vista-oculta">No apareces en el directorio</p>
      ) : (
        <dl className="flex flex-col gap-1 text-sm">
          {DATOS.map(({ campo, opcion, etiqueta }) => {
            const valor = vista[campo];
            const texto = valor ?? (marcados[opcion] ? "no registrado" : "no se muestra");
            return (
              <div key={campo} className="flex gap-2">
                <dt className="w-20 shrink-0 text-zinc-500">{etiqueta}</dt>
                <dd className={valor ? "font-medium" : "text-zinc-400"}>{texto}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
