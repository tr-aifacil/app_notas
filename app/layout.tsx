import "./globals.css";
import type { Metadata } from "next";
import PwaRegister from "@/components/PwaRegister";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Espaço N Saúde | Registo Clínico",
  description: "Plataforma clínica Espaço N Saúde para gestão de pacientes, episódios e sessões"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <ToastProvider>
          <PwaRegister />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
