"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Status = "idle" | "pending" | "error";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameFeedback, setUsernameFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      setUsernameStatus("idle");
      setUsernameFeedback(null);
      return;
    }

    const normalized = username.trim().toLowerCase();

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
          { signal: controller.signal },
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
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [username]);

  const isSubmitDisabled = useMemo(() => {
    if (status === "pending") {
      return true;
    }

    if (usernameStatus === "checking" || usernameStatus === "taken" || usernameStatus === "invalid") {
      return true;
    }

    return false;
  }, [status, usernameStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setStatus("error");
      setMessage("Please choose an available username before continuing.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("pending");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, username }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create your account.");
      }

      await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      router.push(`/login/verify?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="container flex justify-center">
      <div className="card mt-10 w-full max-w-xl space-y-8 p-10">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-[#0f172a]">
            Create your account
          </h1>
          <p className="text-sm text-neutral-500">
            Reserve your username, connect services later, and share your coding journey with one link.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-600" htmlFor="name">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
                placeholder="Ada Lovelace"
                disabled={status === "pending"}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-600" htmlFor="username">
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
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
              placeholder="you@example.com"
              disabled={status === "pending"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-600" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
                placeholder="••••••••"
                disabled={status === "pending"}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-600" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
                placeholder="••••••••"
                disabled={status === "pending"}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-400"
            disabled={isSubmitDisabled}
          >
            {status === "pending" ? "Creating account…" : "Create account"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm text-red-600">{message}</p>
        )}

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link className="font-medium text-teal-600 underline" href="/login">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
