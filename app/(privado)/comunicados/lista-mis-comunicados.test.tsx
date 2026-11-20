import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListaMisComunicados } from "./lista-mis-comunicados";

const comunicados = [
  {
    id: "c-2",
    titulo: "Fumigación en la Torre B",
    categoria: "MANTENIMIENTO" as const,
    fechaPublicacion: "2026-11-20T15:00:00.000Z",
    leido: false,
  },
  {
    id: "c-1",
    titulo: "Corte de agua programado",
    categoria: "AGUA" as const,
    fechaPublicacion: "2026-11-19T15:00:00.000Z",
    leido: true,
  },
];

describe("ListaMisComunicados", () => {
  it("muestra título, categoría, fecha y enlace al detalle, en el orden recibido", () => {
    render(<ListaMisComunicados comunicados={comunicados} />);
    const enlaces = screen.getAllByRole("link");
    expect(enlaces.map((a) => a.getAttribute("href"))).toEqual([
      "/comunicados/c-2",
      "/comunicados/c-1",
    ]);
    expect(enlaces[0]).toHaveTextContent("Fumigación en la Torre B");
    expect(enlaces[0]).toHaveTextContent("Mantenimiento");
    expect(enlaces[0]).toHaveTextContent(/20\/11\/(20)?26/);
    expect(enlaces[1]).toHaveTextContent("Agua");
  });

  it("marca solo los no leídos", () => {
    render(<ListaMisComunicados comunicados={comunicados} />);
    const [noLeido, leido] = screen.getAllByRole("link");
    expect(within(noLeido).getByText("No leído")).toBeInTheDocument();
    expect(within(leido).queryByText("No leído")).not.toBeInTheDocument();
  });
});
