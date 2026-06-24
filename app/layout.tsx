import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gánate el Verano",
  description: "Disfruta del verano… o quédate en casa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-orange-50 text-slate-800">{children}</body>
    </html>
  );
}
