"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";

type UsernameFormProps = {
  currentUsername: string;
};

type Status = "idle" | "pending" | "success" | "error";

export function UsernameForm({ currentUsername }: UsernameFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(currentUsername);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === currentUsername) {
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
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    }
  };

  return (
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
        />
        <p className="text-xs text-neutral-500">
          3-20 characters. Letters, numbers, and underscores only.
        </p>
      </div>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-400"
        disabled={status === "pending"}
      >
        <FiSave className="h-4 w-4" />
        {status === "pending" ? "Saving…" : "Save username"}
      </button>

      {message && (
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
      )}
    </form>
  );
}
