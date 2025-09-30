"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FiLink } from "react-icons/fi";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{2,30}$/;

type ConnectCodechefButtonProps = {
  username?: string | null;
};

export function ConnectCodechefButton({ username }: ConnectCodechefButtonProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [candidateUsername, setCandidateUsername] = useState(username ?? "");
  const [inputError, setInputError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return undefined;
    }

    if (isDialogOpen) {
      setCandidateUsername(username ?? "");
      setInputError(null);
      setRequestError(null);

      const timeout = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [isDialogOpen, isMounted, username]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = candidateUsername.trim();

    if (!normalized) {
      setInputError("Username cannot be empty.");
      return;
    }

    if (!USERNAME_PATTERN.test(normalized)) {
      setInputError("2-30 characters. Letters, numbers, and underscores are allowed.");
      return;
    }

    startTransition(async () => {
      setInputError(null);
      setRequestError(null);

      try {
        const response = await fetch("/api/integrations/codechef", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: normalized }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "Failed to connect CodeChef");
        }

        setIsDialogOpen(false);
        router.refresh();
      } catch (err) {
        setRequestError(err instanceof Error ? err.message : "Unable to connect CodeChef");
      }
    });
  };

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed"
        >
          <FiLink className="h-4 w-4" />
          {isPending ? "Saving…" : username ? "Update handle" : "Connect"}
        </button>
        {requestError ? <p className="text-xs text-rose-500">{requestError}</p> : null}
      </div>

      {isMounted && isDialogOpen
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-[#0f172a]">Connect CodeChef</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Link your CodeChef username to track ratings, stars, and solved problems.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700" htmlFor="codechef-username">
                      CodeChef username
                    </label>
                    <input
                      id="codechef-username"
                      ref={inputRef}
                      type="text"
                      value={candidateUsername}
                      onChange={(event) => setCandidateUsername(event.target.value)}
                      disabled={isPending}
                      autoComplete="off"
                      className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
                      placeholder="your_handle"
                      minLength={2}
                      maxLength={30}
                    />
                    <p className="text-xs text-neutral-500">
                      2-30 characters. Letters, numbers, and underscores are allowed.
                    </p>
                    {inputError ? <p className="text-xs text-rose-500">{inputError}</p> : null}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isPending) return;
                        setIsDialogOpen(false);
                      }}
                      className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800"
                      disabled={isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-400"
                    >
                      {isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
