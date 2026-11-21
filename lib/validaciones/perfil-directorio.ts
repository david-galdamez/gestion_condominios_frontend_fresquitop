import type { DatosDirectorio, OpcionesPerfil } from "@/lib/types/perfil-directorio";

export const MSG_AL_MENOS_UN_DATO = "Elige al menos un dato para mostrar";
export const MSG_TELEFONO =
  "El teléfono debe tener 8 dígitos y empezar con 2, 6 o 7 (ej. 7044-2727)";
export const MSG_SIN_TELEFONO = "Registra tu teléfono para poder mostrarlo";

// Hotfix 1.0.1 · Misma regla que el backend: "70442727", "7044 2727" o
// "7044-2727" -> "7044-2727". Vacío -> null. Lo inválido se devuelve tal cual.
export function normalizarTelefono(valor: string): string | null {
  const limpio = valor.trim();
  if (limpio === "") return null;
  const digitos = limpio.replace(/[\s-]/g, "");
  return /^\d{8}$/.test(digitos) ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : limpio;
}

// Mensaje de error del teléfono, o undefined si es válido (o está vacío).
export function validarTelefono(valor: string): string | undefined {
  const t = normalizarTelefono(valor);
  return t === null || /^[267]\d{3}-\d{4}$/.test(t) ? undefined : MSG_TELEFONO;
}

export type CampoDato = "nombre" | "unidad" | "telefono" | "correo";

export const DATOS: { campo: CampoDato; opcion: keyof OpcionesPerfil; etiqueta: string }[] = [
  { campo: "nombre", opcion: "mostrarNombre", etiqueta: "Nombre" },
  { campo: "unidad", opcion: "mostrarUnidad", etiqueta: "Unidad" },
  { campo: "telefono", opcion: "mostrarTelefono", etiqueta: "Teléfono" },
  { campo: "correo", opcion: "mostrarCorreo", etiqueta: "Correo" },
];

export const PERFIL_OCULTO: OpcionesPerfil = {
  visible: false,
  mostrarNombre: false,
  mostrarUnidad: false,
  mostrarTelefono: false,
  mostrarCorreo: false,
};

const algunDato = (o: OpcionesPerfil) =>
  o.mostrarNombre || o.mostrarUnidad || o.mostrarTelefono || o.mostrarCorreo;

// Mismas reglas que el backend: visible exige al menos un dato marcado y no
// se puede mostrar un teléfono que no está registrado. Sin `telefono` (por
// ejemplo, desde opciones solas) solo se revisa la primera.
export function validarPerfil(o: OpcionesPerfil, telefono?: string) {
  if (o.visible && !algunDato(o)) return MSG_AL_MENOS_UN_DATO;
  if (telefono !== undefined) {
    const error = validarTelefono(telefono);
    if (error) return error;
    if (o.mostrarTelefono && normalizarTelefono(telefono) === null) return MSG_SIN_TELEFONO;
  }
  return undefined;
}

// Vista previa calculada en el navegador (FE-15.2): se actualiza al marcar
// casillas sin esperar al servidor. Misma lógica que aplicarPrivacidad del backend.
export function vistaPrevia(
  o: OpcionesPerfil,
  datos: DatosDirectorio,
): DatosDirectorio | null {
  if (!o.visible) return null;
  return {
    nombre: o.mostrarNombre ? datos.nombre : null,
    unidad: o.mostrarUnidad ? datos.unidad : null,
    telefono: o.mostrarTelefono ? datos.telefono : null,
    correo: o.mostrarCorreo ? datos.correo : null,
  };
}

const esBool = (v: unknown): v is boolean => typeof v === "boolean";

// Lee las 5 opciones de un FormData ("true"/"false"); null si falta alguna.
export function opcionesDesdeFormData(f: FormData): OpcionesPerfil | null {
  const leer = (k: keyof OpcionesPerfil) => {
    const v = f.get(k);
    return v === "true" ? true : v === "false" ? false : undefined;
  };
  const o = {
    visible: leer("visible"),
    mostrarNombre: leer("mostrarNombre"),
    mostrarUnidad: leer("mostrarUnidad"),
    mostrarTelefono: leer("mostrarTelefono"),
    mostrarCorreo: leer("mostrarCorreo"),
  };
  return Object.values(o).every(esBool) ? (o as OpcionesPerfil) : null;
}
