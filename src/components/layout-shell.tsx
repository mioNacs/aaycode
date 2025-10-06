import Link from "next/link";
import { headers } from "next/headers";
import { PropsWithChildren } from "react";

import { SiteHeader } from "@/components/site-header";

const HIDDEN_LAYOUT_PREFIXES = ["/login", "/signup"] as const;

function shouldHideLayout(pathname: string | null) {
  if (!pathname) return false;

  return HIDDEN_LAYOUT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function LayoutShell({ children }: PropsWithChildren) {
  const headersList = await headers();
  const nextUrl = headersList.get("next-url");
  const pathname = nextUrl ? new URL(nextUrl, "http://localhost").pathname : null;

  if (shouldHideLayout(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="pt-24 pb-20">{children}</main>
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
