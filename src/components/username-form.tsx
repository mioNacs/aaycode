"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import { toast } from "sonner";

type UsernameFormProps = {
  currentUsername: string;
};

type Status = "idle" | "pending";
type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error"
  | "current";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [username, setUsername] = useState(currentUsername);
  const [baseUsername, setBaseUsername] = useState(currentUsername);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);

  useEffect(() => {
    setUsername(currentUsername);
    setBaseUsername(currentUsername);
    setUsernameStatus("idle");
    setUsernameFeedback(null);
  }, [currentUsername]);

  useEffect(() => {
    if (!isEditing) {
      setUsernameStatus("idle");
      setUsernameFeedback(null);
      return;
    }

    const normalized = username.trim().toLowerCase();
    const baseNormalized = baseUsername.trim().toLowerCase();

    if (!normalized) {
      setUsernameStatus("idle");
      setUsernameFeedback("3-20 characters. Letters, numbers, and underscores only.");
      return;
    }

    if (normalized === baseNormalized) {
      setUsernameStatus("current");
      setUsernameFeedback("This is your current username.");
      return;
    }

    if (!USERNAME_PATTERN.test(normalized)) {
      setUsernameStatus("invalid");
      setUsernameFeedback("Use 3-20 characters with letters, numbers, or underscores.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameFeedback("Checking availability…");

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/user/username/available?username=${encodeURIComponent(normalized)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const result: { available: boolean; reason?: string } = await response.json();

        if (result.available) {
          setUsernameStatus("available");
          setUsernameFeedback("Nice! Username is available.");
        } else {
          setUsernameStatus("taken");
          setUsernameFeedback(result.reason ?? "That username is already taken.");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Username availability check failed", error);
        setUsernameStatus("error");
        setUsernameFeedback("Couldn't verify username. Try again.");
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [username, baseUsername, isEditing]);

  const isSaveDisabled = useMemo(() => {
    if (status === "pending") {
      return true;
    }

    if (usernameStatus === "checking") {
      return true;
    }

    if (usernameStatus === "invalid" || usernameStatus === "taken" || usernameStatus === "error") {
      return true;
    }

    return false;
  }, [status, usernameStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === baseUsername) {
      toast.info("That's already your username.");
      return;
    }

    if (usernameStatus === "checking") {
      toast.error("Please wait until username availability completes.");
      return;
    }

    if (usernameStatus === "invalid" || usernameStatus === "taken" || usernameStatus === "error") {
      toast.error(usernameFeedback ?? "Please resolve the username issue before saving.");
      return;
    }

    setStatus("pending");

    try {
      const response = await fetch("/api/user/username", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update username.");
      }

      toast.success("Username updated successfully.");

      if (payload.username) {
        setBaseUsername(payload.username);
        setUsername(payload.username);
        setUsernameStatus("current");
        setUsernameFeedback("This is your current username.");

        if (updateSession) {
          await updateSession({
            user: {
              username: payload.username,
            },
          });
        }
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="space-y-2">
      {isEditing ? (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full rounded-lg border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="your_handle"
              disabled={status === "pending"}
              autoFocus
            />
            <p
              className={`text-xs ${
                usernameStatus === "available"
                  ? "text-emerald-600"
                  : usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "error"
                  ? "text-rose-500"
                  : usernameStatus === "checking"
                  ? "text-teal-600"
                  : "text-neutral-500"
              }`}
            >
              {usernameFeedback ?? "3-20 characters. Letters, numbers, and underscores only."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaveDisabled}
            >
              <FiSave className="h-3.5 w-3.5" />
              {status === "pending" ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setUsername(baseUsername);
                setStatus("idle");
                setUsernameStatus("idle");
                setUsernameFeedback(null);
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === "pending"}
            >
              <FiX className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <p className="font-mono text-sm text-[#0f172a]">
            {baseUsername ? `/${baseUsername}` : "Not set yet"}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setIsEditing(true);
              setUsernameStatus("idle");
              setUsernameFeedback(null);
            }}
            className="flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-teal-600 transition hover:bg-teal-50"
          >
            <FiEdit2 className="h-3.5 w-3.5" />
            {baseUsername ? "Edit" : "Set"}
          </button>
        </div>
      )}
    </div>
  );
}
