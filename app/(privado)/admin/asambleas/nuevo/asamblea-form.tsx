'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { guardarAsamblea, type GuardarAsambleaState } from '@/app/actions/asambleas';
import { validarAsamblea, type ErroresAsamblea, type CamposAsamblea } from '@/lib/validaciones/asamblea';

const inputClass = 'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700';
const btnPrimario = 'rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60';
const btnSecundario = 'rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700';
type TemaForm = { titulo: string; opciones: { texto: string }[] };
const inicial: GuardarAsambleaState = { status: 'idle' };

export function AsambleaForm() {
  const [state, formAction, pending] = useActionState(guardarAsamblea, inicial);
  const [campos, setCampos] = useState<CamposAsamblea>({ titulo: '', descripcion: '', fechaApertura: '', fechaCierre: '' });
  const [temas, setTemas] = useState<TemaForm[]>([{ titulo: '', opciones: [{ texto: '' }, { texto: '' }] }]);
  const [errCliente, setErrCliente] = useState<ErroresAsamblea>({});
  const errores: ErroresAsamblea = { ...state.errores, ...errCliente };

  const set = (k: keyof CamposAsamblea, v: string) => { setCampos((c) => ({ ...c, [k]: v })); setErrCliente((e) => ({ ...e, [k]: undefined })); };
  const addTema = () => setTemas((ts) => [...ts, { titulo: '', opciones: [{ texto: '' }, { texto: '' }] }]);
  const removeTema = (i: number) => setTemas((ts) => ts.filter((_, idx) => idx !== i));
  const setTemaTitulo = (i: number, v: string) => setTemas((ts) => ts.map((t, idx) => (idx === i ? { ...t, titulo: v } : t)));
  const addOpcion = (i: number) => setTemas((ts) => ts.map((t, idx) => (idx === i ? { ...t, opciones: [...t.opciones, { texto: '' }] } : t)));
  const removeOpcion = (i: number, oi: number) => setTemas((ts) => ts.map((t, idx) => idx === i ? { ...t, opciones: t.opciones.filter((_, j) => j !== oi) } : t));
  const setOpcion = (i: number, oi: number, v: string) => setTemas((ts) => ts.map((t, idx) => idx === i ? { ...t, opciones: t.opciones.map((o, j) => (j === oi ? { texto: v } : o)) } : t));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const errs = validarAsamblea(campos, temas);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex max-w-3xl flex-col gap-5">
      {state.mensajes?.length ? <div role="alert" className="text-sm text-red-600">{state.mensajes.map((m) => <p key={m}>{m}</p>)}</div> : null}
      <input type="hidden" name="datos" value={JSON.stringify({ ...campos, temas })} />

      <div className="flex flex-col gap-1"><label className="text-sm font-medium">Titulo *</label><input maxLength={100} value={campos.titulo} onChange={(e) => set('titulo', e.target.value)} className={inputClass} />{errores.titulo && <p className="text-sm text-red-600">{errores.titulo}</p>}</div>
      <div className="flex flex-col gap-1"><label className="text-sm font-medium">Descripcion</label><textarea rows={4} maxLength={1000} value={campos.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={inputClass} /><p className="text-right text-xs text-zinc-500">{campos.descripcion.length}/1000</p>{errores.descripcion && <p className="text-sm text-red-600">{errores.descripcion}</p>}</div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1"><label className="text-sm font-medium">Apertura *</label><input type="datetime-local" value={campos.fechaApertura} onChange={(e) => set('fechaApertura', e.target.value)} className={inputClass} /><p className="text-xs text-zinc-500">Para poder publicarla, la apertura debe ser al menos 48 horas después de publicar.</p></div>
        <div className="flex flex-col gap-1"><label className="text-sm font-medium">Cierre *</label><input type="datetime-local" value={campos.fechaCierre} onChange={(e) => set('fechaCierre', e.target.value)} className={inputClass} /></div>
      </div>
      {errores.cierre && <p className="text-sm text-red-600">{errores.cierre}</p>}
      {errores.fecha && <p className="text-sm text-red-600">{errores.fecha}</p>}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Temas a votar (1 a 10)</h2>
        {temas.map((tema, i) => (
          <div key={i} className="rounded-md border border-zinc-300 p-4 dark:border-zinc-700">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Tema {i + 1}</span>{temas.length > 1 && <button type="button" onClick={() => removeTema(i)} className="text-sm text-red-600">Eliminar tema</button>}</div>
            <input placeholder="Titulo del tema (max. 150)" maxLength={150} value={tema.titulo} onChange={(e) => setTemaTitulo(i, e.target.value)} className={`${inputClass} mt-2`} />
            <div className="mt-3 flex flex-col gap-2">
              {tema.opciones.map((op, oi) => (
                <div key={oi} className="flex gap-2">
                  <input placeholder={`Opcion ${oi + 1} (max. 100)`} maxLength={100} value={op.texto} onChange={(e) => setOpcion(i, oi, e.target.value)} className={inputClass} />
                  {tema.opciones.length > 2 && <button type="button" onClick={() => removeOpcion(i, oi)} className="px-2 text-red-600">x</button>}
                </div>
              ))}
              {tema.opciones.length < 10 && <button type="button" onClick={() => addOpcion(i)} className="self-start text-sm text-blue-600">+ Anadir opcion</button>}
            </div>
          </div>
        ))}
        {temas.length < 10 && <button type="button" onClick={addTema} className="rounded-md border border-dashed border-zinc-400 p-2 text-sm">+ Anadir nuevo tema</button>}
        {errores.temas && <p className="text-sm text-red-600">{errores.temas}</p>}
      </section>

      <div className="flex gap-2">
        <Link href="/admin/asambleas" className={btnSecundario}>Cancelar</Link>
        <button type="submit" disabled={pending} className={btnPrimario}>{pending ? 'Guardando...' : 'Guardar Borrador'}</button>
      </div>
    </form>
  );
}