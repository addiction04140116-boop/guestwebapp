import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casty - キャスト専用シークレット相棒アプリ",
  description: "客信・LINE返信のAI代筆、身バレ防止の写真金庫、地雷客を記録する自衛カルテ。夜職で働くすべてのキャストのためのシークレットツール。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CareNote",
  },
  openGraph: {
    title: "Casty - キャスト専用シークレット相棒アプリ",
    description: "客信・LINE返信のAI代筆、身バレ防止の写真金庫、地雷客を記録する自衛カルテ。",
    siteName: "Casty",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casty - キャスト専用シークレット相棒アプリ",
    description: "客信・LINE返信のAI代筆、身バレ防止の写真金庫、地雷客を記録する自衛カルテ。",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}