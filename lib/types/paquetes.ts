export type Mensajeria = "CORREOS" | "DHL" | "FEDEX" | "UPS" | "AMAZON" | "OTRA";
export type EstadoPaquete = "EN_PORTERIA" | "RETENIDO" | "ENTREGADO";

export type UnidadResumen = { id: string; codigo: string };

// Vista de portería: el backend nunca manda el código de retiro.
export type Paquete = {
  id: string;
  codigoPaquete: string;
  unidad: string;
  destinatario: string;
  mensajeria: Mensajeria;
  guia: string | null;
  estado: EstadoPaquete;
  recibidoEn: string;
};
