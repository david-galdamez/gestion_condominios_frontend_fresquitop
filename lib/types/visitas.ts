export type TipoDocumento = "DUI" | "PASAPORTE";
export type EstadoAutorizacion = "VIGENTE" | "USADA" | "CANCELADA" | "VENCIDA";

export type UnidadMia = { id: string; codigo: string };

export type Autorizacion = {
  id: string;
  codigo: string;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  placa: string | null;
  fechaVisita: string;
  horaEstimada: string;
  estado: EstadoAutorizacion;
  unidad: UnidadMia;
  // H07b: último residente que la editó y cuándo (updated_at).
  editadoPor?: { id: string; nombre: string } | null;
  actualizadoEn?: string;
};

// H07b: la unidad no se puede cambiar al editar.
export type CambiosAutorizacion = {
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  placa: string | null;
  fechaVisita: string;
  horaEstimada: string;
};

export type NuevaAutorizacion = {
  unidadId?: string;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  placa?: string;
  fechaVisita: string;
  horaEstimada: string;
};
