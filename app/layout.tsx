import "./globals.css";
import type { Metadata } from "next";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Registo Clínico Interno",
  description: "MVP fisioterapia músculo-esquelética"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
