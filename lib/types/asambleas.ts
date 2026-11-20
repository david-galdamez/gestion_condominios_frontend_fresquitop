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

export type OpcionResultado = { opcionId: string; texto: string; votos: number; porcentaje: number };
export type TemaResultado = { temaId: string; titulo: string; opciones: OpcionResultado[]; ganadora: string | null; empate: boolean; mensajeEmpate?: string };
export type ResultadoAsamblea = { asambleaId: string; estado: string; participacion: number; temas: TemaResultado[] };
export type ComprobanteVerificacion = { valido: boolean; tema: string; asamblea: string; fecha: string };
