import type { EstadoCuota } from "@/lib/types/estado-cuenta";

export type UnidadResumen = { id: string; codigo: string };

export type CuotaPorPagar = {
  id: string;
  periodo: string;
  monto: number;
  fechaVencimiento: string;
  estado: EstadoCuota;
};

export type CuotasPorPagar = {
  unidad: UnidadResumen | null;
  unidades: UnidadResumen[];
  cuotas: CuotaPorPagar[];
};

export type Tarjeta = {
  numero: string;
  vencimiento: string;
  cvv: string;
  titular: string;
};

export type PagoAprobado = {
  numeroTransaccion: string;
  estado: "APROBADO";
  monto: number;
  ultimos4: string;
  fecha: string;
  cuotas: string[];
};

export type Comprobante = {
  numeroTransaccion: string;
  fecha: string;
  monto: number;
  unidad: string;
  ultimos4: string;
  titular: string;
  cuotas: { periodo: string; monto: number }[];
};
