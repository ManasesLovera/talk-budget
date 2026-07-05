import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/language-context";

export const metadata: Metadata = {
  title: "Talk Budget",
  description: "Mobile-first, AI-native personal finance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#12876a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="app-shell">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
