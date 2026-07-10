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
  authors: [{ name: "AvícolaSaaS" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AvícolaSaaS — Gestión Integral de Granjas",
    description: "Plataforma multi-usuario para el control de crianza, finanzas y rendimiento de pollos de engorde.",
    url: "https://xn--avcolasas-h5a.online",
    siteName: "AvícolaSaaS",
    locale: "es_CO",
    type: "website",
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
