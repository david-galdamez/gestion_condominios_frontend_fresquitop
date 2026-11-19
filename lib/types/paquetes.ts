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

// Respuesta de POST /paquetes/{id}/entrega (H10).
export type EntregaPaquete = {
  id: string;
  codigoPaquete: string;
  estado: "ENTREGADO";
  entregadoEn: string;
  entregadoA: string;
};

// Cuerpo de POST /paquetes/{id}/entrega.
export type DatosEntrega = {
  codigoRetiro: string;
  recibidoPor: string;
};

