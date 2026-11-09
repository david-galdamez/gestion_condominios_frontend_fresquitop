"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIA_LABEL } from "@/lib/reportes-ui";
import {
  DESCRIPCION_MAX,
  MAX_FOTOS,
  MENSAJE_FOTOS,
  TITULO_MAX,
  validarCampos,
  validarFoto,
  type ErroresCampos,
} from "@/lib/reportes-validacion";
import { CATEGORIAS_REPORTE, type Ubicaciones } from "@/lib/types/reportes";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const ERROR_GENERICO = "No pudimos registrar el reporte. Intenta de nuevo.";

type FotoLocal = { id: string; file: File; previewUrl: string };

function Contador({ actual, max }: { actual: number; max: number }) {
  return (
    <span
      className={`text-xs tabular-nums ${actual > max ? "text-red-600" : "text-zinc-500"}`}
    >
      {actual} / {max}
    </span>
  );
}

function MensajeError({ id, texto }: { id: string; texto?: string }) {
  return (
    <p id={id} role={texto ? "alert" : undefined} className="min-h-5 text-sm text-red-600">
      {texto ?? ""}
    </p>
  );
}

export function ReporteForm({ ubicaciones }: { ubicaciones: Ubicaciones }) {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<FotoLocal[]>([]);

  const [errores, setErrores] = useState<ErroresCampos>({});
  const [errorFotos, setErrorFotos] = useState("");
  const [errorGeneral, setErrorGeneral] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const inputFotosRef = useRef<HTMLInputElement>(null);
  const siguienteId = useRef(0);

  // Las miniaturas son blob: URLs: hay que liberarlas al quitar la foto y al
  // salir de la página. El ref guarda la lista vigente para el cleanup.
  const fotosRef = useRef<FotoLocal[]>([]);
  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fotosRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  function validarUno(campo: keyof ErroresCampos) {
    const mensaje = validarCampos({ titulo, categoria, ubicacion, descripcion })[campo];
    setErrores((prev) => ({ ...prev, [campo]: mensaje }));
  }

  function limpiarError(campo: keyof ErroresCampos) {
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  }

  function agregarArchivos(archivos: File[]) {
    const nuevas: FotoLocal[] = [];
    let rechazado = false;

    for (const file of archivos) {
      if (validarFoto(file, fotos.length + nuevas.length) !== null) {
        rechazado = true;
        continue;
      }
      siguienteId.current += 1;
      nuevas.push({
        id: String(siguienteId.current),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setErrorFotos(rechazado ? MENSAJE_FOTOS : "");
    if (nuevas.length > 0) setFotos((prev) => [...prev, ...nuevas]);
  }

  function quitarFoto(id: string) {
    const foto = fotos.find((f) => f.id === id);
    if (foto) URL.revokeObjectURL(foto.previewUrl);
    setFotos((prev) => prev.filter((f) => f.id !== id));
    setErrorFotos("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorGeneral([]);

    const erroresCampos = validarCampos({ titulo, categoria, ubicacion, descripcion });
    setErrores(erroresCampos);
    if (Object.keys(erroresCampos).length > 0) return;

    const datos = new FormData();
    datos.append("titulo", titulo.trim());
    datos.append("categoria", categoria);
    datos.append("ubicacion", ubicacion);
    datos.append("descripcion", descripcion.trim());
    fotos.forEach((f) => datos.append("fotos", f.file));

    setEnviando(true);
    try {
      const res = await fetch("/api/reportes", { method: "POST", body: datos });

      // Sesión vencida: el handler redirigió a /login o respondió 401.
      if (res.redirected) {
        window.location.assign(res.url);
        return;
      }
      if (res.status === 401) {
        window.location.assign("/api/sesion/expirada");
        return;
      }

      const body = await res.json().catch(() => null);

      if (res.status === 201 && typeof body?.numero === "string") {
        router.push(`/reportes/${body.numero}?creado=1`);
        return;
      }

      setErrorGeneral(
        Array.isArray(body?.errores) && body.errores.length > 0
          ? body.errores.map(String)
          : [ERROR_GENERICO],
      );
    } catch {
      setErrorGeneral([ERROR_GENERICO]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Detalle del problema */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <label htmlFor="titulo" className="text-sm font-medium">
                Título
              </label>
              <Contador actual={titulo.length} max={TITULO_MAX} />
            </div>
            <input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => validarUno("titulo")}
              placeholder="Ej. Fuga de agua en el pasillo"
              aria-invalid={Boolean(errores.titulo)}
              aria-describedby="titulo-error"
              className={inputClass}
            />
            <MensajeError id="titulo-error" texto={errores.titulo} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="categoria" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                limpiarError("categoria");
              }}
              aria-invalid={Boolean(errores.categoria)}
              aria-describedby="categoria-error"
              className={inputClass}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS_REPORTE.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
            <MensajeError id="categoria-error" texto={errores.categoria} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="ubicacion" className="text-sm font-medium">
              Ubicación
            </label>
            <select
              id="ubicacion"
              value={ubicacion}
              onChange={(e) => {
                setUbicacion(e.target.value);
                limpiarError("ubicacion");
              }}
              aria-invalid={Boolean(errores.ubicacion)}
              aria-describedby="ubicacion-error"
              className={inputClass}
            >
              <option value="">Selecciona una ubicación</option>
              {ubicaciones.torres.length > 0 && (
                <optgroup label="Torres">
                  {ubicaciones.torres.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Áreas comunes">
                {ubicaciones.areasComunes.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </optgroup>
            </select>
            <MensajeError id="ubicacion-error" texto={errores.ubicacion} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <label htmlFor="descripcion" className="text-sm font-medium">
                Descripción
              </label>
              <Contador actual={descripcion.length} max={DESCRIPCION_MAX} />
            </div>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onBlur={() => validarUno("descripcion")}
              rows={6}
              placeholder="Describe el problema con el mayor detalle posible"
              aria-invalid={Boolean(errores.descripcion)}
              aria-describedby="descripcion-error"
              className={inputClass}
            />
            <MensajeError id="descripcion-error" texto={errores.descripcion} />
          </div>
        </div>

        {/* Evidencia fotográfica */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Fotos (opcional)</span>
            <Contador actual={fotos.length} max={MAX_FOTOS} />
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              agregarArchivos(Array.from(e.dataTransfer.files));
            }}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center text-sm ${
              arrastrando
                ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            <p className="text-zinc-600 dark:text-zinc-400">
              Arrastra y suelta tus fotos aquí
            </p>
            <p className="text-xs text-zinc-500">
              Solo JPG o PNG de hasta 5 MB, máximo {MAX_FOTOS} fotos
            </p>
            <button
              type="button"
              onClick={() => inputFotosRef.current?.click()}
              className="rounded-md border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
            >
              Seleccionar fotos
            </button>
            <input
              ref={inputFotosRef}
              type="file"
              multiple
              accept="image/jpeg,image/png"
              className="hidden"
              aria-label="Seleccionar fotos"
              onChange={(e) => {
                const archivos = Array.from(e.target.files ?? []);
                e.target.value = "";
                agregarArchivos(archivos);
              }}
            />
          </div>

          <p aria-live="polite" className="min-h-5 text-sm text-red-600">
            {errorFotos}
          </p>

          {fotos.length > 0 && (
            <ul className="grid grid-cols-3 gap-3">
              {fotos.map((f) => (
                <li key={f.id} className="relative">
                  {/* Miniatura local (blob:), next/image no aplica. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.previewUrl}
                    alt={`Vista previa de ${f.file.name}`}
                    className="aspect-square w-full rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => quitarFoto(f.id)}
                    aria-label={`Quitar ${f.file.name}`}
                    className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {errorGeneral.length > 0 && (
        <div role="alert" className="rounded-md border border-red-300 p-3 text-sm text-red-600">
          {errorGeneral.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Enviando…" : "Enviar reporte"}
        </button>
        <Link
          href="/reportes"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
