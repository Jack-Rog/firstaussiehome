import type { Metadata } from "next";
import { Literata, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "First Aussie Home",
    template: "%s | First Aussie Home",
  },
  description:
    "First Aussie Home is a guided Australian first-home quiz and cost explorer for early-career buyers, built for factual education and scenario modelling only.",
  applicationName: "First Aussie Home",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://aussies-first-home.local"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className={`${manrope.variable} ${literata.variable} antialiased`}>{children}</body>
    </html>
  );
}
