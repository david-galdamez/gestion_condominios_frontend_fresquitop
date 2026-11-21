import type { DatosUsuario } from "@/lib/types/usuarios";

// Validadores puros: los usan el formulario (cliente) y la Server Action.
// Los mensajes coinciden con los del backend (CreateUserDto).

export const MSG = {
  nombre: "El nombre es obligatorio (máximo 120 caracteres)",
  email: "Ingresa un correo válido",
  password:
    "La contraseña debe tener entre 8 y 72 caracteres, con una minúscula, una mayúscula y un número",
  duplicado: "El correo ya está registrado",
} as const;

export type CamposUsuario = {
  nombre: string;
  email: string;
  password: string;
  unidadIds: string[];
};

export type ErroresUsuario = Partial<Record<keyof CamposUsuario, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validarNombre = (v: string) =>
  v.trim().length >= 1 && v.trim().length <= 120 ? undefined : MSG.nombre;

export const validarEmail = (v: string) =>
  v.trim().length <= 254 && EMAIL.test(v.trim()) ? undefined : MSG.email;

export const validarPassword = (v: string) =>
  v.length >= 8 &&
  v.length <= 72 &&
  /[a-z]/.test(v) &&
  /[A-Z]/.test(v) &&
  /\d/.test(v)
    ? undefined
    : MSG.password;

export function validarUsuario(c: CamposUsuario): ErroresUsuario {
  const todos: ErroresUsuario = {
    nombre: validarNombre(c.nombre),
    email: validarEmail(c.email),
    password: validarPassword(c.password),
  };
  return Object.fromEntries(
    Object.entries(todos).filter(([, v]) => v !== undefined),
  ) as ErroresUsuario;
}

export const aDatosUsuario = (c: CamposUsuario): DatosUsuario => ({
  nombre: c.nombre.trim(),
  email: c.email.trim().toLowerCase(),
  password: c.password,
  unidadIds: c.unidadIds,
});

// Ubica bajo su campo los mensajes 400 del backend que reconoce.
export function erroresDesdeApi(messages: string[]) {
  const errores: ErroresUsuario = {};
  const resto: string[] = [];
  for (const m of messages) {
    if (/contraseña/i.test(m)) errores.password = MSG.password;
    else if (/email|correo/i.test(m)) errores.email = MSG.email;
    else if (/nombre/i.test(m)) errores.nombre = MSG.nombre;
    else resto.push(m);
  }
  return { errores, resto };
}
