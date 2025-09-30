"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

type ProfileShareLinkProps = {
  username: string;
};

export function ProfileShareLink({ username }: ProfileShareLinkProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const profileUrl = useMemo(() => {
    if (!username) {
      return "";
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}/u/${username}`;
    }

    return `/u/${username}`;
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
      <button
        type="button"
        onClick={handleCopy}
        className="flex w-full items-center justify-between rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-left text-sm text-teal-700 transition hover:border-teal-200 hover:bg-teal-50"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-500">Share your profile</p>
          <p className="font-mono text-base text-teal-800">{profileUrl || "/"}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-teal-600 shadow-sm">
          {isCopied ? <FiCheck className="h-5 w-5" /> : <FiCopy className="h-5 w-5" />}
        </span>
      </button>
      {message ? (
        <p className={`text-xs ${isCopied ? "text-emerald-600" : "text-rose-500"}`}>{message}</p>
      ) : null}
    </div>
  );
}
