export type UnidadActiva = { id: string; codigo: string };

// Cuerpo de POST /users. El rol no se envía: el backend crea siempre RESIDENTE.
export type DatosUsuario = {
  email: string;
  password: string;
  nombre: string;
  unidadIds: string[];
};

export type Torre = { id: string; nombre: string };

// Cuerpo de POST /unidades.
export type DatosUnidad = { torreId: string; codigo: string };
