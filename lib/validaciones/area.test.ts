import { describe, expect, it } from "vitest";
import {
  aDatosArea,
  erroresDesdeApi,
  HORAS,
  MSG,
  validarArea,
  validarCapacidad,
  validarCierre,
  validarDuracion,
  validarHora,
  validarNombre,
} from "./area";

const validos = {
  nombre: "Alberca",
  capacidad: "30",
  horaApertura: "07:00",
  horaCierre: "19:00",
  duracionMaxHoras: "2",
};

describe("validaciones de área", () => {
  it("nombre: 3 a 40 sin contar espacios de los extremos", () => {
    expect(validarNombre("Abc")).toBeUndefined();
    expect(validarNombre("a".repeat(40))).toBeUndefined();
    expect(validarNombre("Ab")).toBe(MSG.nombre);
    expect(validarNombre("a".repeat(41))).toBe(MSG.nombre);
    expect(validarNombre("   ab   ")).toBe(MSG.nombre);
  });

  it("capacidad: entero de 1 a 200", () => {
    for (const v of ["1", "200", "80"]) expect(validarCapacidad(v)).toBeUndefined();
    for (const v of ["0", "201", "", "2.5", "-3", "abc"]) {
      expect(validarCapacidad(v)).toBe(MSG.capacidad);
    }
  });

  it("duración: entero de 1 a 8", () => {
    expect(validarDuracion("1")).toBeUndefined();
    expect(validarDuracion("8")).toBeUndefined();
    expect(validarDuracion("0")).toBe(MSG.duracion);
    expect(validarDuracion("9")).toBe(MSG.duracion);
  });

  it("hora: solo en punto", () => {
    expect(validarHora("00:00")).toBeUndefined();
    expect(validarHora("23:00")).toBeUndefined();
    for (const v of ["08:30", "8:00", "24:00", ""]) expect(validarHora(v)).toBe(MSG.hora);
    expect(HORAS).toHaveLength(24);
    expect(HORAS[0]).toBe("00:00");
    expect(HORAS[23]).toBe("23:00");
  });

  it("cierre: posterior a la apertura; formato inválido tiene prioridad", () => {
    expect(validarCierre("08:00", "22:00")).toBeUndefined();
    expect(validarCierre("10:00", "10:00")).toBe(MSG.horario);
    expect(validarCierre("22:00", "08:00")).toBe(MSG.horario);
    expect(validarCierre("08:00", "08:30")).toBe(MSG.hora);
    // Si la apertura es inválida, ese error lo reporta su propio campo.
    expect(validarCierre("xx", "08:00")).toBeUndefined();
  });

  it("validarArea devuelve solo los campos con error", () => {
    expect(validarArea(validos)).toEqual({});
    expect(
      validarArea({ ...validos, nombre: "a", capacidad: "0", horaCierre: "06:00" }),
    ).toEqual({
      nombre: MSG.nombre,
      capacidad: MSG.capacidad,
      horaCierre: MSG.horario,
    });
  });

  it("aDatosArea recorta el nombre y convierte números", () => {
    expect(aDatosArea({ ...validos, nombre: "  Alberca  " })).toEqual({
      nombre: "Alberca",
      capacidad: 30,
      horaApertura: "07:00",
      horaCierre: "19:00",
      duracionMaxHoras: 2,
    });
  });

  it("erroresDesdeApi ubica los mensajes conocidos bajo su campo", () => {
    expect(
      erroresDesdeApi([MSG.capacidad, MSG.horario, "property activa should not exist"]),
    ).toEqual({
      errores: { capacidad: MSG.capacidad, horaCierre: MSG.horario },
      resto: ["property activa should not exist"],
    });
  });
});
