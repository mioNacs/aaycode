import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
    </>
  );
}
