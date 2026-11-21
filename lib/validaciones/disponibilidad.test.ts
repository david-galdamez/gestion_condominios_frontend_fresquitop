import { describe, expect, it } from "vitest";
import type { AreaDisponibilidad } from "@/lib/types/disponibilidad";
import {
  enlaceDisponibilidad,
  enlaceReserva,
  fechaConsultable,
  fechaMaxima,
  filtrarAreas,
  hayLibres,
  prellenadoDesdeParams,
} from "./disponibilidad";

const HOY = "2026-11-20";

const area = (id: string, estados: ("LIBRE" | "OCUPADO")[]): AreaDisponibilidad => ({
  id,
  nombre: id,
  capacidad: 10,
  bloques: estados.map((estado, i) => ({
    inicio: `${String(7 + i).padStart(2, "0")}:00`,
    fin: `${String(8 + i).padStart(2, "0")}:00`,
    estado,
  })),
});

describe("fechaConsultable", () => {
  it("acepta hoy y hoy + 30; rechaza ayer, hoy + 31 y fechas inválidas", () => {
    expect(fechaMaxima(HOY)).toBe("2026-12-20");
    expect(fechaConsultable(HOY, HOY)).toBe(true);
    expect(fechaConsultable("2026-12-20", HOY)).toBe(true);
    expect(fechaConsultable("2026-11-19", HOY)).toBe(false);
    expect(fechaConsultable("2026-12-21", HOY)).toBe(false);
    expect(fechaConsultable("2026-11-31", HOY)).toBe(false);
    expect(fechaConsultable("", HOY)).toBe(false);
  });
});

describe("filtrarAreas y hayLibres", () => {
  const areas = [area("alberca", ["OCUPADO", "LIBRE"]), area("salon", ["OCUPADO"])];

  it("sin filtro o con un id desconocido muestra todas", () => {
    expect(filtrarAreas(areas, "")).toHaveLength(2);
    expect(filtrarAreas(areas, "otra")).toHaveLength(2);
    expect(filtrarAreas(areas, "salon").map((a) => a.id)).toEqual(["salon"]);
  });

  it("hayLibres es falso si todos los bloques están ocupados", () => {
    expect(hayLibres(areas)).toBe(true);
    expect(hayLibres([areas[1]])).toBe(false);
    expect(hayLibres([])).toBe(false);
  });
});

describe("enlaces", () => {
  it("lleva el bloque elegido a /reservas/nueva", () => {
    expect(enlaceReserva("a1", "2026-11-21", "09:00")).toBe(
      "/reservas/nueva?areaId=a1&fecha=2026-11-21&horaInicio=09%3A00",
    );
  });

  it("conserva el área al cambiar de fecha solo si hay una elegida", () => {
    expect(enlaceDisponibilidad("2026-11-21", "")).toBe("/reservas/disponibilidad?fecha=2026-11-21");
    expect(enlaceDisponibilidad("2026-11-21", "a1")).toBe(
      "/reservas/disponibilidad?fecha=2026-11-21&areaId=a1",
    );
  });
});

describe("prellenadoDesdeParams", () => {
  const alberca = {
    id: "a1",
    nombre: "Alberca",
    capacidad: 20,
    horaApertura: "07:00",
    horaCierre: "19:00",
    duracionMaxHoras: 3,
    activa: true,
  };

  it("acepta área de la lista, fecha no pasada y hora dentro del horario", () => {
    expect(
      prellenadoDesdeParams({ areaId: "a1", fecha: "2026-11-21", horaInicio: "09:00" }, [alberca], HOY),
    ).toEqual({ areaId: "a1", fecha: "2026-11-21", horaInicio: "09:00" });
  });

  it("descarta lo que el formulario no puede mostrar", () => {
    expect(prellenadoDesdeParams({ areaId: "x" }, [alberca], HOY)).toEqual({});
    expect(prellenadoDesdeParams({}, [alberca], HOY)).toEqual({});
    expect(
      prellenadoDesdeParams({ areaId: "a1", fecha: "2026-11-19", horaInicio: "19:00" }, [alberca], HOY),
    ).toEqual({ areaId: "a1", fecha: undefined, horaInicio: undefined });
    expect(
      prellenadoDesdeParams({ areaId: ["a1", "a2"], fecha: "2026-13-01" }, [alberca], HOY),
    ).toEqual({});
  });
});
