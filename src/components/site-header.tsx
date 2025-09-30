import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUserSession } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getCurrentUserSession();

  const navLinks = session
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: `/u/${session.user?.username ?? "profile"}`, label: "Profile" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/login", label: "Login" },
        { href: "/signup", label: "Sign up" },
      ];

  const primaryAction = session
    ? { href: "/dashboard", label: "Go to dashboard" }
    : { href: "/signup", label: "Get started" };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(15,23,42,0.07)] bg-[rgba(255,255,255,0.85)] backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-neutral-700">
          <span className="inline-flex p-1 items-center justify-center rounded-md bg-teal-100 font-mono text-sm text-teal-600">
            &lt;I/&gt;
          </span>
          AyyCode
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-teal-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? <SignOutButton /> : null}
          <Link
            href={primaryAction.href}
            className="rounded-full border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500"
          >
            <span className="text-white">{primaryAction.label}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
