import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalonNote - 個人サロン・インフルエンサー向け顧客＆SNS管理",
  description: "SNS・ブログ投稿文のAI代筆、ギャラリーの管理、お客様の好みやアレルギーを記録する顧客カルテ。サロン運営をスマートにする専用ツール。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SalonNote",
  },
  openGraph: {
    title: "SalonNote - 個人サロン・インフルエンサー向け顧客＆SNS管理",
    description: "SNS文章のAI代筆、ギャラリー管理、お客様の好みを記録する顧客カルテ。",
    siteName: "SalonNote",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SalonNote - 個人サロン・インフルエンサー向け顧客＆SNS管理",
    description: "SNS文章のAI代筆、ギャラリー管理、お客様の好みを記録する顧客カルテ。",
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
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}