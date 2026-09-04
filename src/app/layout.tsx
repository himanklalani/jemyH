import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import CartDrawer from "@/components/cart/CartDrawer";
import SmoothScrollProvider from "@/providers/SmoothScrollProvider";
import QueryProvider from "@/providers/QueryProvider";
import Preloader from "@/components/layout/Preloader";

// JetBrains Mono — precision data / prices / labels
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Jemy | Premium Eyewear & Sunglasses",
  description: "Elevating everyday vision through timeless design and superior lens technology.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jemy.shop'),
  openGraph: {
    title: 'Jemy | Premium Eyewear & Sunglasses',
    description: 'Elevating everyday vision through timeless design and superior lens technology.',
    url: 'https://jemy.shop',
    siteName: 'Jemy',
    images: [
      {
        url: '/images/jemy-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Jemy Eyewear',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jemy | Premium Eyewear & Sunglasses',
    description: 'Elevating everyday vision through timeless design and superior lens technology.',
    images: ['/images/jemy-og.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${jetbrainsMono.variable} min-h-[100dvh] w-full overflow-x-clip flex flex-col font-sans antialiased bg-[#EAEBE6]`}
      >
        <QueryProvider>
          <SmoothScrollProvider>
            <Preloader />
            <Navbar />
            <Breadcrumbs />
            <CartDrawer />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </SmoothScrollProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

