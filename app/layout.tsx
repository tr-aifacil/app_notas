import "./globals.css";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Registo Clínico Interno",
  description: "MVP fisioterapia músculo-esquelética"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={nunito.variable}>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
