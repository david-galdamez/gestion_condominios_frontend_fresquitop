export type EstadoAsamblea = 'BORRADOR' | 'PUBLICADA' | 'ABIERTA' | 'CERRADA';
export type OpcionTema = { id: string; texto: string; orden: number };
export type TemaVotacion = { id: string; titulo: string; orden: number; opciones: OpcionTema[] };

export type Asamblea = {
  id: string;
  titulo: string;
  descripcion: string;
  fechaApertura: string;
  fechaCierre: string;
  estado: EstadoAsamblea;
  publicadaEn: string | null;
  temas: TemaVotacion[];
};

export type NuevaAsamblea = {
  titulo: string;
  descripcion: string;
  fechaApertura: string;
  fechaCierre: string;
  temas: { titulo: string; opciones: { texto: string }[] }[];
};