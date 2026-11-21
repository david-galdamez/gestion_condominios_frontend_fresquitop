import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

const ERROR_GENERICO = "No pudimos registrar el reporte. Intenta de nuevo.";

// Reenvía el multipart del formulario al backend con el token de la cookie
// httpOnly (el navegador nunca ve el token). Se usa un Route Handler y no un
// Server Action porque estos últimos limitan el cuerpo a 1 MB por defecto y
// aquí pueden viajar hasta 5 fotos de 5 MB.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { errores: ["Tu sesión expiró. Inicia sesión de nuevo."] },
      { status: 401 },
    );
  }
  if (user.rol !== "RESIDENTE") {
    return NextResponse.json(
      { errores: ["No tienes permiso para esta acción"] },
      { status: 403 },
    );
  }

  let entrada: FormData;
  try {
    entrada = await request.formData();
  } catch {
    return NextResponse.json({ errores: [ERROR_GENERICO] }, { status: 400 });
  }

  // Se arma un FormData limpio: el backend rechaza campos que no conoce.
  const salida = new FormData();
  for (const campo of ["titulo", "categoria", "ubicacion", "descripcion"]) {
    const valor = entrada.get(campo);
    if (typeof valor === "string") salida.append(campo, valor);
  }
  for (const foto of entrada.getAll("fotos")) {
    if (foto instanceof File) salida.append("fotos", foto, foto.name);
  }

  let res: Response;
  try {
    res = await apiFetch("reportes", { method: "POST", body: salida });
  } catch (e) {
    // El redirect() de apiFetch (401) debe propagarse; solo se captura la red.
    if (e instanceof Error && !("digest" in e)) {
      return NextResponse.json({ errores: [ERROR_GENERICO] }, { status: 502 });
    }
    throw e;
  }

  const body = await res.json().catch(() => null);

  if (res.status === 201 && typeof body?.numero === "string") {
    return NextResponse.json({ numero: body.numero }, { status: 201 });
  }

  if (res.status === 400) {
    const m = body?.message;
    const errores = Array.isArray(m)
      ? m.map(String)
      : typeof m === "string"
        ? [m]
        : ["Revisa los datos del reporte."];
    return NextResponse.json({ errores }, { status: 400 });
  }

  if (res.status === 403) {
    return NextResponse.json(
      { errores: ["No tienes permiso para esta acción"] },
      { status: 403 },
    );
  }

  return NextResponse.json({ errores: [ERROR_GENERICO] }, { status: 502 });
}
