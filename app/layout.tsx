import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { default: `${s.name} - ${s.description}`, template: `%s | ${s.name}` },
    description: s.seoDescription || s.description,
    keywords: ["論壇", "社群", "討論區", s.name],
    authors: [{ name: s.name }],
    openGraph: {
      type: "website",
      locale: "zh_TW",
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      siteName: s.name,
      title: s.seoTitle || `${s.name} - ${s.description}`,
      description: s.seoDescription || s.description,
      images: [{ url: "/api/og?type=site", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: s.seoTitle || `${s.name} - ${s.description}`,
      description: s.seoDescription || s.description,
      images: ["/api/og?type=site"],
    },
    robots: { index: true, follow: true },
    appleWebApp: { capable: true, title: s.name, statusBarStyle: "default" },
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <ToastProvider />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
