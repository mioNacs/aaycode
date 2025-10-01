"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiRefreshCcw } from "react-icons/fi";

type SyncIntegrationButtonProps = {
  endpoint: string;
  serviceName: string;
};

export function SyncIntegrationButton({ endpoint, serviceName }: SyncIntegrationButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? `Failed to sync ${serviceName}`);
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : `Unable to sync ${serviceName}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed"
      >
        <FiRefreshCcw className="h-4 w-4" />
        {isPending ? "Syncing…" : "Sync now"}
      </button>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}
