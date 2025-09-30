"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { FiGithub } from "react-icons/fi";

type ConnectGitHubButtonProps = {
  connected: boolean;
  username?: string | null;
};

export function ConnectGitHubButton({ connected, username }: ConnectGitHubButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleConnect = () => {
    startTransition(async () => {
      await signIn("github", { callbackUrl: "/dashboard?connected=github" });
    });
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed"
    >
      <FiGithub className="h-4 w-4" />
      {isPending
        ? "Connecting…"
        : connected
        ? username
          ? `Reconnect GitHub (@${username})`
          : "Reconnect GitHub"
        : "Connect GitHub"}
    </button>
  );
}
