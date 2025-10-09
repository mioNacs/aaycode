import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUserSession } from "@/lib/auth";
import { AyyCodeLogo } from "@/components/ayycode-logo";

export async function SiteHeader() {
  const session = await getCurrentUserSession();

  const navLinks = session
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: `/u/${session.user?.username ?? "profile"}`, label: "Profile" },
      ]
    : [];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(15,23,42,0.07)] bg-[rgba(255,255,255,0.85)] backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-neutral-700 transition hover:opacity-80">
          <AyyCodeLogo className="h-10 w-10" />
          <span>AyyCode</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
            >
              <span className="transition hover:text-teal-600">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? <SignOutButton /> : null}
          {!session && <>
          <Link
            href="/signup"
            className="rounded-full border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500"
          >
            <span className="text-white">Get Started</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-teal-600 hover:border-teal-300 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-50"
          >
            <span className="text-teal-600 hover:text-black">Login</span>
          </Link>
          </>}
        </div>
      </div>
    </header>
  );
}
