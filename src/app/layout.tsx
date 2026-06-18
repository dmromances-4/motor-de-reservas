import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Motor de Reservas",
  description: "Plataforma de reservas para restaurantes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
