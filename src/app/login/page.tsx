"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { AiFillGithub } from "react-icons/ai";

type Status = "idle" | "pending" | "error";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const callbackUrl = useMemo(
		() => searchParams.get("callbackUrl") ?? "/dashboard",
		[searchParams]
	);

	const oauthError = searchParams.get("error");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState<string | null>(null);

	const isPending = status === "pending";

	const handleProviderLogin = async (provider: "google" | "github") => {
		setStatus("pending");
		setMessage(null);

		const response = await signIn(provider, { callbackUrl, redirect: false });

		if (response?.error) {
			setStatus("error");
			setMessage(response.error);
			return;
		}

		setStatus("idle");

		if (response?.url) {
			router.push(response.url);
		}
	};

	const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setStatus("pending");
		setMessage(null);

		const result = await signIn("credentials", {
			email,
			password,
			callbackUrl,
			redirect: false,
		});

		if (result?.error) {
			setStatus("error");
			setMessage(result.error);
			return;
		}

		setStatus("idle");
		setPassword("");

		if (result?.url) {
			router.push(result.url);
		}
	};

	return (
		<div className="container flex justify-center">
			<div className="card mt-10 w-full max-w-lg space-y-8 p-10">
				<header className="space-y-3 text-center">
					<h1 className="text-3xl font-semibold text-[#0f172a]">Welcome back</h1>
					<p className="text-sm text-neutral-500">
						Sign in with your favourite provider or use email and password to access your dashboard.
					</p>
				</header>

				<div className="space-y-4">
					<button
						type="button"
						className="flex w-full items-center justify-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-teal-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed"
						disabled={isPending}
						onClick={() => handleProviderLogin("google")}
					>
						<FcGoogle className="h-5 w-5" />
						Continue with Google
					</button>

					<button
						type="button"
						className="flex w-full items-center justify-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-teal-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed"
						disabled={isPending}
						onClick={() => handleProviderLogin("github")}
					>
						<AiFillGithub className="h-5 w-5" />
						Continue with GitHub
					</button>
				</div>

				<form className="space-y-4" onSubmit={handlePasswordLogin}>
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
							disabled={isPending}
						/>
					</div>

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
							className="w-full rounded-xl border border-teal-100 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed"
							placeholder="••••••••"
							disabled={isPending}
						/>
					</div>

					<button
						type="submit"
						className="w-full rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-400"
						disabled={isPending}
					>
						{isPending ? "Signing in…" : "Sign in"}
					</button>
				</form>

				<p className="text-center text-sm text-neutral-500">
					Need an account?{" "}
					<Link className="font-medium text-teal-600 underline" href="/signup">
						Create one
					</Link>
				</p>

				{(message || oauthError) && (
					<p
						className={`text-center text-sm ${
							status === "error" || oauthError ? "text-red-600" : "text-green-600"
						}`}
					>
						{oauthError ? `Unable to sign in: ${oauthError}` : message}
					</p>
				)}
			</div>
		</div>
	);
}
