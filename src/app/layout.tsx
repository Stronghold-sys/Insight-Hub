import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Insight Hub — Kenali Diri, Perbaiki Relasi",
    template: "%s | Insight Hub",
  },
  description: "Platform self-awareness berbasis sains buat kamu yang mau ngerti pola komunikasi, attachment style, love language, dan dinamika relasi dengan lebih waras.",
  keywords: ["attachment style", "love language", "relasi", "komunikasi", "self-awareness", "psikologi", "chat analyzer"],
  authors: [{ name: "Tim Insight Hub" }],
  openGraph: {
    title: "Insight Hub — Kenali Diri, Perbaiki Relasi",
    description: "Platform self-awareness berbasis sains buat kamu yang mau ngerti pola komunikasi, attachment style, love language, dan dinamika relasi.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insight Hub — Kenali Diri, Perbaiki Relasi",
    description: "Platform self-awareness berbasis sains buat kamu yang mau ngerti pola komunikasi, attachment style, love language, dan dinamika relasi.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0286C3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ position: 'relative', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
