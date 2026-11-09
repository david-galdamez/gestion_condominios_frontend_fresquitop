import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de paquetes de hasta 5 MB (H09) + el margen del multipart.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
