export type Area = {
  id: string;
  nombre: string;
  capacidad: number;
  horaApertura: string;
  horaCierre: string;
  duracionMaxHoras: number;
  activa: boolean;
};

// Cuerpo de POST /areas y PUT /areas/:id.
export type DatosArea = Omit<Area, "id" | "activa">;
