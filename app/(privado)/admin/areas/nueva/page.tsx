import type { Metadata } from "next";
import { requireRol } from "@/lib/auth";
import { AreaForm } from "../area-form";

export const metadata: Metadata = { title: "Nueva área" };

export default async function NuevaAreaPage() {
  await requireRol("ADMINISTRADOR");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva área</h1>
      <AreaForm />
    </div>
  );
}
