// app/layout.tsx
// Purpose: Global site layout with conditional footer, glass background, and global utilities.

import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import AppBackground from "./components/AppBackground";
import FooterWrapper from "@/app/components/home/FooterWrapper.tsx";
import BackToTop from "./components/home/BackToTop";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ford School Management",
  description: "Single-tenant school management system",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full text-neutral-dark overflow-x-hidden`}
      >
        {/* Glass-like translucent background */}
        <AppBackground>
          {/* Main content area */}
          {children}
        </AppBackground>

        {/* Conditionally rendered footer */}
        <FooterWrapper />

        {/* Scroll helper */}
        <BackToTop />

        {/* Global notifications */}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
