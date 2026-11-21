export type OpcionesPerfil = {
  visible: boolean;
  mostrarNombre: boolean;
  mostrarUnidad: boolean;
  mostrarTelefono: boolean;
  mostrarCorreo: boolean;
};

// null = no registrado o no se muestra.
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

// Lo que se envía al guardar: las opciones y el teléfono (null lo borra).
export type GuardarPerfil = OpcionesPerfil & { telefono: string | null };
