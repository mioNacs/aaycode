"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-teal-600 bg-white cursor-pointer hover:bg-teal-50 px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-neutral-800 disabled:cursor-not-allowed"
    >
      {isPending ? "Signing out…" : "Log out"}
    </button>
  );
}
