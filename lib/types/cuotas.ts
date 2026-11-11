// Contrato de /cuotas (H02, BE-2.1).

export type ConfiguracionCuota = {
  montoMensual: number;
  diaVencimiento: number;
  // "YYYY-MM-DD"
  vigenteDesde: string;
};

export type DatosConfiguracion = {
  montoMensual: number;
  diaVencimiento: number;
};

export type ResultadoGeneracion = {
  // "YYYY-MM"
  periodo: string;
  creadas: number;
  omitidas: number;
};
