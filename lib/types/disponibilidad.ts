export type EstadoBloque = "LIBRE" | "OCUPADO";

// Bloque de 1 hora de un área (H23). Nunca trae quién reservó.
export type Bloque = {
  inicio: string; // "07:00"
  fin: string; // "08:00"
  estado: EstadoBloque;
};

export type AreaDisponibilidad = {
  id: string;
  nombre: string;
  capacidad: number;
  bloques: Bloque[];
};

// Respuesta de GET /api/v1/areas/disponibilidad?fecha=
export type Disponibilidad = {
  fecha: string; // "2026-11-21"
  areas: AreaDisponibilidad[];
};
