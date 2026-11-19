export type EstadoReserva = "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

// Respuesta de POST /reservas y elemento de GET /reservas/mias (H04).
export type Reserva = {
  id: string;
  codigo: string; // "RES-000123"
  area: string; // nombre del área, p. ej. "Alberca"
  fecha: string; // "2026-11-10"
  horaInicio: string; // "09:00"
  horaFin: string; // "11:00"
  asistentes: number;
  estado: EstadoReserva;
};

// Cuerpo de POST /reservas. La unidad y el residente salen de la sesión.
export type NuevaReserva = {
  areaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  asistentes: number;
};
