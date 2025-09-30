"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";

type UsernameFormProps = {
  currentUsername: string;
};

type Status = "idle" | "pending" | "success" | "error";

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(currentUsername);
  const [baseUsername, setBaseUsername] = useState(currentUsername);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setUsername(currentUsername);
    setBaseUsername(currentUsername);
  }, [currentUsername]);

  const messageMarkup =
    message && (
      <p
        className={`text-sm ${
          status === "error"
            ? "text-red-600"
            : status === "success"
            ? "text-green-600"
            : "text-neutral-500"
        }`}
      >
        {message}
      </p>
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === baseUsername) {
      setMessage("That's already your username.");
      setStatus("success");
      return;
    }

    setStatus("pending");
    setMessage(null);

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

      setStatus("success");
      setMessage("Username updated successfully.");

      if (payload.username) {
        setBaseUsername(payload.username);
        setUsername(payload.username);
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setStatus((previous) => (previous === "pending" ? "idle" : previous));
    }
  };

  return (
    <div className="space-y-4">
      {isEditing ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
              placeholder="your_handle"
              disabled={status === "pending"}
              autoFocus
            />
            <p className="text-xs text-neutral-500">
              3-20 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-400"
              disabled={status === "pending"}
            >
              <FiSave className="h-4 w-4" />
              {status === "pending" ? "Saving…" : "Save username"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setUsername(baseUsername);
                setStatus("idle");
                setMessage(null);
              }}
              className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800"
              disabled={status === "pending"}
            >
              <FiX className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-white p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Current username</p>
            <p className="font-mono text-lg text-[#0f172a]">
              {baseUsername ? `/${baseUsername}` : "Not set yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setMessage(null);
              setIsEditing(true);
            }}
            className="flex items-center justify-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700"
          >
            <FiEdit2 className="h-4 w-4" />
            {baseUsername ? "Edit username" : "Set username"}
          </button>
        </div>
      )}

      {messageMarkup}
    </div>
  );
}
