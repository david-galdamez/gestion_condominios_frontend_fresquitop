export type OpcionesPerfil = {
  visible: boolean;
  mostrarNombre: boolean;
  mostrarUnidad: boolean;
  mostrarTelefono: boolean;
  mostrarCorreo: boolean;
};

// null = no existe (p. ej. el teléfono, que el registro todavía no guarda).
export type DatosDirectorio = {
  nombre: string | null;
  unidad: string | null;
  telefono: string | null;
  correo: string | null;
};

export type PerfilDirectorio = OpcionesPerfil & {
  misDatos: DatosDirectorio;
  // Solo los datos marcados; null si está oculto.
  vistaPrevia: DatosDirectorio | null;
};
