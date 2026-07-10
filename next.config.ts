import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Headers de seguridad aplicados a todas las respuestas.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Evita clickjacking: la app no puede embebarse en un iframe.
          { key: "X-Frame-Options", value: "DENY" },
          // Fuerza HTTPS declarado por el navegador.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer mínimo: solo origen, no la ruta completa.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permisos del navegador: niega cámara, micrófono, geolocalización.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS: fuerza HTTPS durante 1 año (solo tiene efecto sobre HTTPS).
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
