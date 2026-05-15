import type { Metadata } from "next";
import { Inter } from "next/font"
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema Integrado de Matrículas - SEED/PR",
  description: "Plataforma de gestão de matrículas Estágio Probatório e PedFor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-background text-on-surface antialiased`}>
        {children}
      </body>
    </html>
  );
}
