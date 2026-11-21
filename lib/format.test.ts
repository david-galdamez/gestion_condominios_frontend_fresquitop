import { afterEach, describe, expect, it, vi } from "vitest";
import {
  esFechaValida,
  fechaEnRango,
  formatFecha,
  formatPeriodo,
  formatUsd,
  hoyEnElSalvador,
  sumarDias,
} from "./format";

describe("formatUsd", () => {
  it("usa 2 decimales y moneda USD", () => {
    const s = formatUsd(1234.5);
    expect(s).toContain("1");
    expect(s).toMatch(/234[.,]50$/);
    expect(s).toMatch(/\$|US/);
    expect(formatUsd(0)).toMatch(/0[.,]00$/);
    expect(formatUsd(10)).toMatch(/10[.,]00$/);
  });
});

describe("formatPeriodo", () => {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
    "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  it.each(meses.map((m, i) => [String(i + 1).padStart(2, "0"), m]))(
    "mes %s -> %s",
    (mm, nombre) => {
      expect(formatPeriodo(`2026-${mm}`)).toBe(`${nombre} 2026`);
    },
  );
  it("devuelve el original si el mes no existe", () => {
    expect(formatPeriodo("2026-13")).toBe("2026-13");
  });
});

describe("formatFecha", () => {
  const tzOriginal = process.env.TZ;
  afterEach(() => {
    process.env.TZ = tzOriginal;
    vi.unstubAllEnvs();
  });
  it("formatea dd/mm/aaaa", () => {
    expect(formatFecha("2026-10-10")).toBe("10/10/2026");
    expect(formatFecha("2026-01-05T00:00:00.000Z")).toBe("05/01/2026");
  });
  it.each(["America/El_Salvador", "Pacific/Kiritimati", "Pacific/Pago_Pago"])(
    "sin corrimiento con TZ=%s",
    (tz) => {
      process.env.TZ = tz;
      expect(formatFecha("2026-03-01")).toBe("01/03/2026");
      expect(formatFecha("2026-12-31")).toBe("31/12/2026");
    },
  );
});

describe("esFechaValida", () => {
  it.each(["2026-10-10", "2028-02-29", "2000-02-29", "2026-12-31", "2026-04-30"])(
    "válida: %s",
    (f) => expect(esFechaValida(f)).toBe(true),
  );
  it.each([
    "2026-02-29", "2100-02-29", "2026-02-31", "2026-04-31", "2026-13-01",
    "2026-00-10", "2026-10-00", "2026-10-32", "26-10-10", "2026/10/10",
    "2026-1-1", "", "abcd-ef-gh", "2026-10-10T00:00", " 2026-10-10",
  ])("inválida: %s", (f) => expect(esFechaValida(f)).toBe(false));
});

describe("hoyEnElSalvador", () => {
  afterEach(() => vi.useRealTimers());

  it("a las 02:00 UTC todavía es el día anterior en El Salvador (UTC-6)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T02:00:00Z"));
    expect(hoyEnElSalvador()).toBe("2026-11-04");
  });

  it("a las 06:00 UTC ya es el día nuevo", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T06:00:00Z"));
    expect(hoyEnElSalvador()).toBe("2026-11-05");
  });

  it("cruza el fin de año", () => {
    expect(hoyEnElSalvador(new Date("2027-01-01T05:59:00Z"))).toBe("2026-12-31");
  });
});

describe("sumarDias", () => {
  it("suma dentro del mes y cruzando mes y año", () => {
    expect(sumarDias("2026-11-04", 1)).toBe("2026-11-05");
    expect(sumarDias("2026-11-04", 30)).toBe("2026-12-04");
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("respeta bisiestos y restas", () => {
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(sumarDias("2027-02-28", 1)).toBe("2027-03-01");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("fechaEnRango", () => {
  const hoy = "2026-11-04";
  it("acepta hoy y hoy+30", () => {
    expect(fechaEnRango("2026-11-04", hoy, 30)).toBe(true);
    expect(fechaEnRango("2026-12-04", hoy, 30)).toBe(true);
  });
  it("rechaza ayer, hoy+31 y fechas inexistentes o mal formadas", () => {
    expect(fechaEnRango("2026-11-03", hoy, 30)).toBe(false);
    expect(fechaEnRango("2026-12-05", hoy, 30)).toBe(false);
    expect(fechaEnRango("2026-11-31", hoy, 30)).toBe(false);
    expect(fechaEnRango("", hoy, 30)).toBe(false);
  });
});
