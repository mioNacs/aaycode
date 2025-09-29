"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Status = "idle" | "pending" | "error";

export default function SignUpPage() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [name, setName] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

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
						Reserve your username, connect services later, and share your coding
						journey with one link.
					</p>
				</header>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<label
								className="block text-sm font-medium text-neutral-600"
								htmlFor="name"
							>
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
							<label
								className="block text-sm font-medium text-neutral-600"
								htmlFor="username"
							>
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
					</div>

					<div className="space-y-2">
						<label
							className="block text-sm font-medium text-neutral-600"
							htmlFor="email"
						>
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
							<label
								className="block text-sm font-medium text-neutral-600"
								htmlFor="password"
							>
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
							<label
								className="block text-sm font-medium text-neutral-600"
								htmlFor="confirm-password"
							>
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
						disabled={status === "pending"}
					>
						{status === "pending" ? "Creating account…" : "Create account"}
					</button>
				</form>

				{message && (
					<p className="text-center text-sm text-red-600">{message}</p>
				)}

				<p className="text-center text-sm text-neutral-500">
					Already have an account?{" "}
					<Link
						className="font-medium text-teal-600 underline"
						href="/login"
					>
						Sign in instead
					</Link>
				</p>
			</div>
		</div>
	);
}
