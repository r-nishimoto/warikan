import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waroya - みんなでサクッと割り勘",
  description: "旅行やイベントの割り勘計算をスムーズに",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Waroya",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="min-h-screen max-w-lg mx-auto">{children}</div>
      </body>
    </html>
  );
}
