// Validadores puros: se usan igual en el formulario (cliente) y en la Server
// Action. Los mensajes son los mismos que devuelve el backend (H21).

export const MSG = {
  cuotas: "Marca al menos una cuota",
  numero: "El número de tarjeta debe tener 16 dígitos",
  vencimiento: "La tarjeta está vencida o la fecha no es válida (MM/AA)",
  cvv: "El CVV debe tener 3 dígitos",
  titular: "El titular debe tener entre 3 y 60 caracteres",
} as const;

export type CamposTarjeta = {
  numero: string;
  vencimiento: string;
  cvv: string;
  titular: string;
};

export type ErroresPago = Partial<Record<keyof CamposTarjeta | "cuotas", string>>;

const soloDigitos = (v: string) => v.replace(/\D/g, "");

// "4242424242424242" -> "4242 4242 4242 4242" (máx. 16 dígitos).
export const mascaraTarjeta = (v: string) =>
  soloDigitos(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

// "1228" -> "12/28"; agrega la barra al escribir el tercer dígito.
export function mascaraVencimiento(v: string) {
  const d = soloDigitos(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export const validarCuotas = (ids: string[]) =>
  ids.length > 0 ? undefined : MSG.cuotas;

// Solo dígitos y espacios (los de la máscara); 16 dígitos en total.
export const validarNumero = (v: string) =>
  /^\d{16}$/.test(v.replace(/\s/g, "")) ? undefined : MSG.numero;

// mesActual: "YYYY-MM" de hoy en El Salvador (lo calcula el servidor).
export function validarVencimiento(v: string, mesActual: string) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v);
  if (!m) return MSG.vencimiento;
  return `20${m[2]}-${m[1]}` >= mesActual ? undefined : MSG.vencimiento;
}

export const validarCvv = (v: string) => (/^\d{3}$/.test(v) ? undefined : MSG.cvv);

export const validarTitular = (v: string) =>
  v.trim().length >= 3 && v.trim().length <= 60 ? undefined : MSG.titular;

// Devuelve solo los campos con error; un objeto vacío significa válido.
export function validarPago(
  cuotaIds: string[],
  t: CamposTarjeta,
  mesActual: string,
): ErroresPago {
  const todos: ErroresPago = {
    cuotas: validarCuotas(cuotaIds),
    numero: validarNumero(t.numero),
    vencimiento: validarVencimiento(t.vencimiento, mesActual),
    cvv: validarCvv(t.cvv),
    titular: validarTitular(t.titular),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresPago;
}

// Suma en centavos para no arrastrar errores de punto flotante.
export function totalSeleccion(cuotas: { id: string; monto: number }[], ids: string[]) {
  const marcadas = new Set(ids);
  const centavos = cuotas
    .filter((c) => marcadas.has(c.id))
    .reduce((s, c) => s + Math.round(c.monto * 100), 0);
  return centavos / 100;
}

export const tarjetaParaApi = (t: CamposTarjeta) => ({
  numero: soloDigitos(t.numero),
  vencimiento: t.vencimiento,
  cvv: t.cvv,
  titular: t.titular.trim(),
});

// Ubica bajo su campo los mensajes 400 del backend que reconoce.
const CAMPO_DE_MENSAJE: Record<string, keyof ErroresPago> = {
  [MSG.numero]: "numero",
  [MSG.vencimiento]: "vencimiento",
  [MSG.cvv]: "cvv",
  [MSG.titular]: "titular",
};

export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresPago = {};
  const resto: string[] = [];
  for (const m of messages) {
    const campo = CAMPO_DE_MENSAJE[m];
    if (campo) errores[campo] = m;
    else resto.push(m);
  }
  return { errores, resto };
}
