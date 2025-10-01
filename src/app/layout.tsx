import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AyyCode – Your coding profile, unified",
  description: "Aggregate and share your coding achievements with a beautiful public profile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-transparent text-[#101828]`}>
        <AuthSessionProvider>
          <SiteHeader />
          <main className="pt-24 pb-20">
            {children}
          </main>
          <footer className="border-t border-[rgba(15,23,42,0.07)] bg-[rgba(255,255,255,0.75)] py-10">
            <div className="container flex flex-col gap-6 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
              <p>&copy; {new Date().getFullYear()} AyyCode. All rights reserved.</p>
              <nav className="flex flex-wrap gap-4">
                <Link href="/">Home</Link>
                <Link href="/login">Login</Link>
                <Link href="/signup">Sign up</Link>
                <Link href="/dashboard">Dashboard</Link>
              </nav>
            </div>
          </footer>
        </AuthSessionProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
