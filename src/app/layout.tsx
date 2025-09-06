import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Providers } from './providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sa3aMatch - Football Field Booking",
  description: "Book football fields in Khouribga with ease. Discover, reserve, and play!",
  keywords: "football, field booking, Khouribga, sports, recreation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          <Script
            crossOrigin="anonymous"
            src="//unpkg.com/same-runtime/dist/index.global.js"
          />
        </head>
        <body suppressHydrationWarning className="antialiased">
          <Providers>
            <ClientBody>{children}</ClientBody>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
