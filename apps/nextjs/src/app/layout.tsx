import { TRPCReactProvider } from "@/trpc/react";
import { HydrateClient } from "@/trpc/server";
import { ClerkProvider } from "@clerk/nextjs";

import "@acme/ui/styles.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "prismjs/themes/prism-tomorrow.css";

import { Toaster } from "sonner";

import "../notion-styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notion Maps 📍",
  description: "Display locations from Notion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-muted group/root antialiased`}
        >
          <TRPCReactProvider>
            <HydrateClient>{children}</HydrateClient>
          </TRPCReactProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
