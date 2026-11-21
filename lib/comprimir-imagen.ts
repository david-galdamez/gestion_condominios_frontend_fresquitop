// Reduce el peso de una foto en el navegador antes de subirla. Vercel limita
// el cuerpo de una petición a ~4.5 MB, y una foto de celular suele pesar más.
// Si algo falla (navegador sin soporte, imagen rara) devuelve el archivo
// original sin tocar: comprimir nunca debe impedir subir la foto.

// Originales más grandes se rechazan antes de intentar decodificarlos.
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

// Peso objetivo por foto. Con hasta 5 fotos por reporte el total queda < 4 MB.
export const OBJETIVO_BYTES = 700 * 1024;

const INTENTOS = [
  { max: 1600, calidad: 0.8 },
  { max: 1600, calidad: 0.65 },
  { max: 1280, calidad: 0.55 },
  { max: 1024, calidad: 0.5 },
];

const TIPOS = ["image/jpeg", "image/png"];

function aBlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
}

export async function comprimirImagen(archivo: File): Promise<File> {
  if (!TIPOS.includes(archivo.type) || archivo.size <= OBJETIVO_BYTES) {
    return archivo;
  }
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return archivo;
  }

  try {
    // from-image respeta la rotación EXIF (fotos de celular en vertical).
    const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    let mejor: Blob | null = null;

    for (const { max, calidad } of INTENTOS) {
      const escala = Math.min(1, max / Math.max(imagen.width, imagen.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagen.width * escala));
      canvas.height = Math.max(1, Math.round(imagen.height * escala));
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      // JPEG no tiene transparencia: un PNG con fondo transparente saldría negro.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);

      const blob = await aBlob(canvas, calidad);
      if (!blob) continue;
      if (!mejor || blob.size < mejor.size) mejor = blob;
      if (blob.size <= OBJETIVO_BYTES) break;
    }
    imagen.close?.();

    if (!mejor || mejor.size >= archivo.size) return archivo;
    const nombre = archivo.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([mejor], `${nombre}.jpg`, { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}
