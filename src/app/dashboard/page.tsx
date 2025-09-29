import { redirect } from "next/navigation";

import { UsernameForm } from "@/components/username-form";
import { getCurrentUserSession } from "@/lib/auth";
import { FiCopy } from "react-icons/fi";

export default async function DashboardPage() {
	const session = await getCurrentUserSession();

	if (!session?.user) {
		redirect("/login");
	}

	const displayName = session.user.name ?? session.user.email ?? "Your account";
	const username = session.user.username ?? "";

		return (
			<main className="container flex min-h-[70vh] flex-col justify-center gap-10 py-16">
				<section className="card space-y-4 p-10">
					<div className="space-y-2">
						<p className="text-sm uppercase tracking-widest text-teal-500">Dashboard</p>
						<h1 className="text-4xl font-semibold text-[#0f172a]">Welcome back, {displayName}</h1>
									<p className="text-sm text-neutral-500">
										Signed in as {session.user.email ?? "your connected account"}. Manage your public presence and keep your profile up to date.
						</p>
					</div>
					{username && (
						<div className="flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-700">
							<FiCopy className="h-4 w-4" />
							<span>Share your profile at <span className="font-mono text-teal-800">/{username}</span></span>
						</div>
					)}
				</section>

				<section className="card max-w-2xl space-y-4 p-10">
					<div className="space-y-2">
						<h2 className="text-2xl font-semibold text-[#0f172a]">Update your username</h2>
						<p className="text-sm text-neutral-500">
							Usernames help others find your public profile. They can be changed at any time, as long as they
							remain unique and within the guidelines.
						</p>
					</div>
					<UsernameForm currentUsername={username} />
				</section>
			</main>
		);
}
