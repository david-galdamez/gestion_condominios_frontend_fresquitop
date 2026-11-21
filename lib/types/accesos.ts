import type { TipoDocumento } from "@/lib/types/visitas";

// Contrato de /accesos (H08, BE-8.1 y BE-8.2).

export type EstadoAcceso = "DENTRO" | "SALIO";

export type Acceso = {
  id: string;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  // Código de la unidad, p. ej. "A-101".
  unidad: string;
  motivo: string | null;
  preautorizado: boolean;
  estado: EstadoAcceso;
  // ISO date-time
  horaEntrada: string;
  horaSalida: string | null;
};

export type EntradaSinCodigo = {
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  unidadId: string;
  motivo: string;
};
