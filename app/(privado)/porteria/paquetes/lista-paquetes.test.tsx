import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Paquete } from "@/lib/types/paquetes";
import { formatLlegada, ListaPaquetes } from "./lista-paquetes";

const base: Paquete = {
  id: "p1",
  codigoPaquete: "PAQ-000124",
  unidad: "A-101",
  destinatario: "Ana Martínez",
  mensajeria: "AMAZON",
  guia: null,
  estado: "EN_PORTERIA",
  recibidoEn: "2026-11-05T00:40:00.000Z",
};

describe("ListaPaquetes", () => {
  it("muestra código, unidad, mensajería, guía y estado", () => {
    render(
      <ListaPaquetes
        paquetes={[
          base,
          { ...base, id: "p2", codigoPaquete: "PAQ-000118", mensajeria: "FEDEX", guia: "G-9", estado: "RETENIDO" },
        ]}
      />,
    );
    expect(screen.getByText("PAQ-000124")).toBeInTheDocument();
    expect(screen.getByText("Amazon")).toBeInTheDocument();
    expect(screen.getByText("FedEx")).toBeInTheDocument();
    expect(screen.getByText("Guía G-9")).toBeInTheDocument();
    expect(screen.getByText("En portería")).toBeInTheDocument();
    expect(screen.getByText("Retenido")).toBeInTheDocument();
  });

  it("la llegada se muestra en hora de El Salvador", () => {
    // 00:40 UTC del 5/11 = 18:40 del 4/11 en El Salvador (UTC-6).
    expect(formatLlegada("2026-11-05T00:40:00.000Z")).toBe("04/11/2026 18:40");
  });

  it("no hay columna ni dato de código de retiro", () => {
    render(<ListaPaquetes paquetes={[base]} />);
    expect(screen.queryByText(/retiro/i)).not.toBeInTheDocument();
  });
});
