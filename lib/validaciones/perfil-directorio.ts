import type { DatosDirectorio, OpcionesPerfil } from "@/lib/types/perfil-directorio";

export const MSG_AL_MENOS_UN_DATO = "Elige al menos un dato para mostrar";

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

// Misma regla que el backend: visible exige al menos un dato marcado.
export const validarPerfil = (o: OpcionesPerfil) =>
  o.visible && !algunDato(o) ? MSG_AL_MENOS_UN_DATO : undefined;

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
