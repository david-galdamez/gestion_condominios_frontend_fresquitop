import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de paquetes de hasta 5 MB (H09) + el margen del multipart.
      bodySizeLimit: "6mb",
    },
  },
  // Las cuotas del residente viven en "Estado de cuenta"; /cuotas no es una
  // página propia y daba 404 (el administrador usa /admin/cuotas).
  async redirects() {
    return [{ source: "/cuotas", destination: "/estado-cuenta", permanent: false }];
  },
};

export default nextConfig;
