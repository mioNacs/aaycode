import { notFound } from "next/navigation";

import { findUserByUsername } from "@/lib/users";

type ProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const user = await findUserByUsername(params.username);

  if (!user) {
    notFound();
  }

  const displayName = user.name ?? user.username ?? params.username;

  return (
    <main className="container flex min-h-[70vh] flex-col gap-10 py-16">
      <header className="card space-y-3 p-10">
        <p className="text-sm uppercase tracking-wide text-teal-500">Profile</p>
        <h1 className="text-4xl font-semibold text-[#0f172a]">{displayName}</h1>
        <p className="text-sm text-neutral-500">@{user.username}</p>
      </header>

      <section className="card space-y-6 p-10">
        <div>
          <h2 className="text-2xl font-semibold text-[#0f172a]">Activity overview</h2>
          <p className="mt-2 text-sm text-neutral-500">
            This is where the aggregated coding insights for @{user.username} will appear. Connect
            services to populate this space with GitHub, LeetCode, Codeforces, and more.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-700">
            GitHub stats placeholder
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-700">
            LeetCode stats placeholder
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-700">
            Codeforces stats placeholder
          </div>
        </div>
      </section>
    </main>
  );
}