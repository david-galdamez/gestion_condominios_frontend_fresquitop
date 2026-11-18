export type CategoriaComunicado =
  | "AGUA"
  | "ELECTRICIDAD"
  | "MANTENIMIENTO"
  | "SEGURIDAD"
  | "AVISO_GENERAL";
export type EstadoComunicado = "PROGRAMADO" | "PUBLICADO" | "EXPIRADO";

export type Torre = { id: string; nombre: string };

export type Comunicado = {
  id: string;
  titulo: string;
  contenido: string;
  categoria: CategoriaComunicado;
  paraTodos: boolean;
  torres: Torre[];
  estado: EstadoComunicado;
  fechaPublicacion: string;
  fechaExpiracion: string | null;
  autor: { id: string; nombre: string };
};

export type NuevoComunicado = {
  titulo: string;
  contenido: string;
  categoria: CategoriaComunicado;
  destino: { todos: boolean; torreIds?: string[] };
  fechaPublicacion?: string;
  fechaExpiracion?: string;
};
