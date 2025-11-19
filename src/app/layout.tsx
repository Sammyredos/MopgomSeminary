import type { Metadata } from "next";
import "./globals.css";
import "@/styles/fonts.css";
import "@/styles/animations.css";
import { TitleManager } from "@/components/TitleManager";
import { FaviconManager } from "@/components/FaviconManager";
import { ProgressBar } from "@/components/ProgressBar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FontLoader } from "@/components/ui/font-loader";
import { UserProvider } from "@/contexts/UserContext";


export const metadata: Metadata = {
  title: "Loading...", // Will be immediately replaced by TitleManager
  description: "Mopgom Theological Seminary - Comprehensive seminary management system for student registration, courses, grades, and academic administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        {/* Prevent any default favicon loading - FaviconManager will handle everything */}
        <meta name="msapplication-config" content="none" />
        {/* Prevent iOS auto-linking that can cause hydration mismatches */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

        {/* Preload Space Grotesk font files for faster rendering */}
        <link
          rel="preload"
          href="/fonts/SpaceGrotesk-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SpaceGrotesk-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/SpaceGrotesk-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* DNS Prefetch for font optimization */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Critical Space Grotesk Font CSS - Inlined for immediate loading */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'Space Grotesk';
              src: url('/fonts/SpaceGrotesk-Regular.woff2') format('woff2');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Space Grotesk';
              src: url('/fonts/SpaceGrotesk-Medium.woff2') format('woff2');
              font-weight: 500;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Space Grotesk';
              src: url('/fonts/SpaceGrotesk-Bold.woff2') format('woff2');
              font-weight: 700;
              font-style: normal;
              font-display: swap;
            }
            html, body, * {
              font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            }
          `
        }} />
      </head>
      <body className="antialiased text-gray-900 bg-white" suppressHydrationWarning={true}>
        <UserProvider>
          <FontLoader showOnlyOnInitialLogin={true}>
            <LanguageProvider>
              <ProgressBar />
              <TitleManager />
              <FaviconManager />
              {children}
            </LanguageProvider>
          </FontLoader>
        </UserProvider>
        {process.env.NODE_ENV === 'development' && (
          <div id="performance-monitor-root" />
        )}
      </body>
    </html>
  );
}
