import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaptionForge — Transparent Text Animation Generator",
  description:
    "Generate stunning animated caption overlays with custom fonts, colors, and effects. Export as transparent WebM video — zero cost, no uploads needed.",
  keywords: "captions, subtitles, video overlay, text animation, transparent video, creator tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
