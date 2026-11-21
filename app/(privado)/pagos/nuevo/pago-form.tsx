"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { pagarAction, type PagarState } from "@/app/actions/pagos";
import { EstadoCuotaBadge } from "@/components/estado-cuota-badge";
import { formatFecha, formatPeriodo, formatUsd } from "@/lib/format";
import type { CuotaPorPagar } from "@/lib/types/pagos";
import {
  mascaraTarjeta,
  mascaraVencimiento,
  totalSeleccion,
  validarCvv,
  validarNumero,
  validarPago,
  validarTitular,
  validarVencimiento,
  type CamposTarjeta,
  type ErroresPago,
} from "@/lib/validaciones/pago";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";
const btnPrimario =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60";

const inicial: PagarState = { status: "idle" };

// Idempotency-Key: crypto.randomUUID solo existe en contextos seguros
// (https o localhost); fuera de ellos se arma con getRandomValues.
function nuevaClave() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

type Props = {
  cuotas: CuotaPorPagar[];
  preseleccion: string[];
  // "YYYY-MM" de hoy en El Salvador, calculado en el servidor.
  mesActual: string;
};

export function PagoForm({ cuotas, preseleccion, mesActual }: Props) {
  const [state, formAction, pending] = useActionState(pagarAction, inicial);
  const [marcadas, setMarcadas] = useState<string[]>(preseleccion);
  // Los datos de la tarjeta y la clave viven solo en este estado local: se
  // pierden al salir de la pantalla.
  const [tarjeta, setTarjeta] = useState<CamposTarjeta>({
    numero: "",
    vencimiento: "",
    cvv: "",
    titular: "",
  });
  const [clave, setClave] = useState(nuevaClave);
  const [errCliente, setErrCliente] = useState<ErroresPago>({});
  const [editado, setEditado] = useState(false);
  // `pending` tarda un render en reflejar el envío: con doble clic los dos
  // eventos llegarían antes. Este candado se toma al enviar y se suelta al terminar.
  const enviando = useRef(false);
  useEffect(() => {
    if (!pending) enviando.current = false;
  }, [pending, state]);

  const total = totalSeleccion(cuotas, marcadas);
  const errores: ErroresPago = { ...state.errores, ...errCliente };
  const completo = Object.keys(validarPago(marcadas, tarjeta, mesActual)).length === 0;
  // El mensaje del servidor (rechazo, 409, error) se oculta en cuanto el usuario cambia algo.
  const mensaje = !editado ? state.mensaje : undefined;

  function alternar(id: string) {
    setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
    setErrCliente((e) => ({ ...e, cuotas: undefined }));
    setEditado(true);
  }

  function set<K extends keyof CamposTarjeta>(k: K, v: string) {
    setTarjeta((t) => ({ ...t, [k]: v }));
    setErrCliente((e) => ({ ...e, [k]: undefined }));
    setEditado(true);
  }

  function blur(k: keyof CamposTarjeta, error: string | undefined) {
    setErrCliente((e) => ({ ...e, [k]: error }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || enviando.current) return; // doble clic: no se envía otra solicitud
    const errs = validarPago(marcadas, tarjeta, mesActual);
    setErrCliente(errs);
    if (Object.keys(errs).length > 0) return;

    // Tras un rechazo se reintenta con otra clave; si no, la misma clave hace
    // que un reenvío devuelva el pago original sin cobrar dos veces.
    let usar = clave;
    if (state.claveRechazada === clave) {
      usar = nuevaClave();
      setClave(usar);
    }

    const fd = new FormData();
    for (const id of marcadas) fd.append("cuotaIds", id);
    fd.set("numero", tarjeta.numero);
    fd.set("vencimiento", tarjeta.vencimiento);
    fd.set("cvv", tarjeta.cvv);
    fd.set("titular", tarjeta.titular);
    fd.set("clave", usar);
    setEditado(false);
    enviando.current = true;
    startTransition(() => formAction(fd));
  }

  const campo = (k: keyof CamposTarjeta, label: string, control: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={k} className="text-sm font-medium">
        {label}
      </label>
      {control}
      {errores[k] && (
        <p id={`${k}-error`} className="text-sm text-red-600">
          {errores[k]}
        </p>
      )}
    </div>
  );

  const ariaDe = (k: keyof CamposTarjeta) => ({
    "aria-invalid": errores[k] ? true : undefined,
    "aria-describedby": errores[k] ? `${k}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-2xl flex-col gap-6">
      <fieldset className="flex flex-col gap-2" aria-describedby={errores.cuotas ? "cuotas-error" : undefined}>
        <legend className="mb-2 text-sm font-medium">Cuotas a pagar</legend>
        <ul className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-900 dark:border-zinc-800">
          {cuotas.map((c) => (
            <li key={c.id}>
              <label className="flex items-center gap-3 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={marcadas.includes(c.id)}
                  onChange={() => alternar(c.id)}
                  disabled={pending}
                />
                <span className="flex-1">
                  {formatPeriodo(c.periodo)}
                  <span className="block text-xs text-zinc-500">Vence {formatFecha(c.fechaVencimiento)}</span>
                </span>
                <EstadoCuotaBadge estado={c.estado} />
                <span className="w-24 text-right tabular-nums">{formatUsd(c.monto)}</span>
              </label>
            </li>
          ))}
        </ul>
        {errores.cuotas && (
          <p id="cuotas-error" className="text-sm text-red-600">
            {errores.cuotas}
          </p>
        )}
        <p className="text-right text-lg font-semibold">
          Total a pagar: <span data-testid="total" className="tabular-nums">{formatUsd(total)}</span>
        </p>
        <p className="text-right text-xs text-zinc-500">Se pagan cuotas completas; no hay pagos parciales.</p>
      </fieldset>

      <fieldset disabled={pending} className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <legend className="px-1 text-sm font-medium">Datos de la tarjeta</legend>
        {campo(
          "numero",
          "Número de tarjeta",
          <input
            id="numero"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={tarjeta.numero}
            onChange={(e) => set("numero", mascaraTarjeta(e.target.value))}
            onBlur={() => blur("numero", validarNumero(tarjeta.numero))}
            className={`${inputClass} tabular-nums`}
            {...ariaDe("numero")}
          />,
        )}
        <div className="grid grid-cols-2 gap-4">
          {campo(
            "vencimiento",
            "Vencimiento (MM/AA)",
            <input
              id="vencimiento"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="12/28"
              value={tarjeta.vencimiento}
              onChange={(e) => set("vencimiento", mascaraVencimiento(e.target.value))}
              onBlur={() => blur("vencimiento", validarVencimiento(tarjeta.vencimiento, mesActual))}
              className={inputClass}
              {...ariaDe("vencimiento")}
            />,
          )}
          {campo(
            "cvv",
            "CVV",
            <input
              id="cvv"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={3}
              value={tarjeta.cvv}
              onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))}
              onBlur={() => blur("cvv", validarCvv(tarjeta.cvv))}
              className={inputClass}
              {...ariaDe("cvv")}
            />,
          )}
        </div>
        {campo(
          "titular",
          "Titular",
          <input
            id="titular"
            type="text"
            autoComplete="cc-name"
            maxLength={60}
            value={tarjeta.titular}
            onChange={(e) => set("titular", e.target.value)}
            onBlur={() => blur("titular", validarTitular(tarjeta.titular))}
            className={inputClass}
            {...ariaDe("titular")}
          />,
        )}
        <p className="text-xs text-zinc-500">
          Tarjetas de prueba: 4242 4242 4242 4242 (aprueba) y 4000 0000 0000 0002 (fondos insuficientes).
        </p>
      </fieldset>

      {mensaje && (
        <p role="alert" className="rounded-md border border-red-600/40 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {mensaje}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending || !completo} className={btnPrimario}>
          {pending ? "Procesando pago..." : `Pagar ${formatUsd(total)}`}
        </button>
      </div>
    </form>
  );
}
