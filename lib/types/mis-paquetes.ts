export type EstadoPaquete = 'EN_PORTERIA' | 'RETENIDO' | 'ENTREGADO';

export type MiPaquete = {
  id: string;
  codigoPaquete: string;
  recibidoEn: string;
  mensajeria: string;
  estado: EstadoPaquete;
  entregadoEn: string | null;
};

export type DetallePaquete = MiPaquete & {
  codigoRetiro: string | null;
};