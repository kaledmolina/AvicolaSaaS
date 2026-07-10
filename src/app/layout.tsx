import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AvícolaSaaS — Gestión Integral de Granjas Avícolas",
  description:
    "Plataforma multi-usuario para el control de crianza, finanzas y rendimiento de pollos de engorde. Lotes, gastos, mortalidad, pesajes y ventas en un solo lugar.",
  keywords: ["granja avícola", "pollos de engorde", "gestión avícola", "lotes", "finanzas agrícolas"],
  authors: [{ name: "AvícolaSaaS", url: "https://xn--avcolasas-h5a.online" }],
  creator: "AvícolaSaaS",
  publisher: "AvícolaSaaS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "AvícolaSaaS — Gestión Integral de Granjas Avícolas",
    description: "Plataforma multi-usuario líder para el control inteligente de crianza, gastos, mortalidad, pesajes y ventas de pollos de engorde. Optimiza tu granja hoy.",
    url: "https://xn--avcolasas-h5a.online",
    siteName: "AvícolaSaaS",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Logo de AvícolaSaaS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AvícolaSaaS — Gestión Integral de Granjas",
    description: "Control total de tu granja avícola en un solo lugar. Gestiona lotes, ventas y finanzas con facilidad.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
