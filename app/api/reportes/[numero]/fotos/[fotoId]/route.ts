import { apiFetch } from "@/lib/api";

// Las fotos del backend exigen sesión y ser el dueño del reporte, y el
// navegador no tiene el token (cookie httpOnly): este handler las pide con el
// token y las reenvía. Por eso el <img> apunta aquí y no al backend.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ numero: string; fotoId: string }> },
) {
  const { numero, fotoId } = await params;

  const res = await apiFetch(
    `reportes/${encodeURIComponent(numero)}/fotos/${encodeURIComponent(fotoId)}`,
  );
  if (!res.ok || !res.body) {
    return new Response("No encontrado", { status: 404 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
