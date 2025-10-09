"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

type ProfileShareLinkProps = {
  username: string;
};

export function ProfileShareLink({ username }: ProfileShareLinkProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState(`/u/${username}`);

  // Update the URL with full origin after mounting to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined" && username) {
      setProfileUrl(`${window.location.origin}/u/${username}`);
    }
  }, [username]);

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
      setMessage(null);
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  const handleCopy = async () => {
    if (!profileUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
      setMessage("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy profile link", error);
      setIsCopied(false);
      setMessage("Unable to copy. Try again.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="group relative overflow-hidden rounded-lg border border-teal-100 bg-gradient-to-br from-teal-50 to-blue-50 p-4 transition hover:border-teal-200">
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-600">Your Profile Link</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="flex-1 truncate font-mono text-sm text-teal-900">{profileUrl || "/"}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-teal-600 shadow-sm transition hover:bg-teal-50 hover:text-teal-700"
          >
            {isCopied ? (
              <>
                <FiCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <FiCopy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      {message && !isCopied ? (
        <p className="text-xs text-rose-500">{message}</p>
      ) : null}
    </div>
  );
}
