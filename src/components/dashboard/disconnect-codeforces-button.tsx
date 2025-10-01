"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiX } from "react-icons/fi";
import { toast } from "sonner";

export function DisconnectCodeforcesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/integrations/codeforces", {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Failed to disconnect Codeforces");
        }

        toast.success("Codeforces disconnected");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to disconnect Codeforces");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed"
      >
        <FiX className="h-4 w-4" />
        {isPending ? "Disconnecting…" : "Disconnect"}
      </button>
    </div>
  );
}
