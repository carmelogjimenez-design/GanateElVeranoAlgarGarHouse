import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Gánate el Verano",
  description: "Disfruta del verano… o quédate en casa.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Gánate", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#0B1F3A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
