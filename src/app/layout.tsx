import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { LiveVideoProvider } from "@/contexts/LiveVideoContext";

export const metadata: Metadata = {
  title: "ЛевПрав | Арт-студия",
  description: "Арт-студия авторских handmade изделий. The Lion is Right.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-canvas text-graphite antialiased" suppressHydrationWarning>
        <LiveVideoProvider>
          <LanguageProvider defaultLocale="ru">
            {children}
          </LanguageProvider>
        </LiveVideoProvider>
      </body>
    </html>
  );
}
