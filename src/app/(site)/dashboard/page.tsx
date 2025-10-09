import { redirect } from "next/navigation";
import { FiUser, FiLink2, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

import { ProfileShareLink } from "@/components/profile/profile-share-link";
import { UsernameForm } from "@/components/username-form";
import { ConnectedServicesSection } from "@/components/dashboard/connected-services-section";
import { getCurrentUserSession } from "@/lib/auth";
import { findUserById } from "@/lib/users";

export default async function DashboardPage() {
  const session = await getCurrentUserSession();

  if (!session?.user) {
    redirect("/login");
  }

  const displayName = session.user.name ?? session.user.email ?? "Your account";
  const username = session.user.username ?? "";
  const userRecord = session.user.id ? await findUserById(session.user.id) : null;
  const connections = userRecord?.connections;

  const connectedCount = [
    connections?.github,
    connections?.leetcode,
    connections?.codeforces,
    connections?.codechef,
    connections?.geeksforgeeks,
  ].filter(Boolean).length;

  const setupComplete = username && connectedCount > 0;

  return (
    <main className="container min-h-[70vh] py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-teal-600">Dashboard</p>
            <h1 className="text-3xl font-bold text-[#0f172a] md:text-4xl">Welcome back, {displayName}</h1>
            <p className="mt-2 text-sm text-neutral-600">
              {session.user.email ?? "your connected account"}
            </p>
          </div>
          {setupComplete && (
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <FiCheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Setup Complete</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
              <FiUser className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Username</p>
              <p className="text-lg font-semibold text-[#0f172a]">
                {username ? `@${username}` : "Not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
              <FiLink2 className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Connected Services</p>
              <p className="text-lg font-semibold text-[#0f172a]">{connectedCount} of 5</p>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${username ? "bg-emerald-50" : "bg-amber-50"}`}>
              {username ? (
                <FiCheckCircle className="h-6 w-6 text-emerald-600" />
              ) : (
                <FiAlertCircle className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Profile Status</p>
              <p className={`text-lg font-semibold ${username ? "text-emerald-600" : "text-amber-600"}`}>
                {username ? "Public" : "Not Public"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#0f172a]">Profile Setup</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Configure your public profile and share it with others
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                    <FiUser className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700">Username</h3>
                    <p className="text-xs text-neutral-500">Your unique identifier</p>
                  </div>
                </div>
                <UsernameForm currentUsername={username} />
              </div>

              {username && (
                <div className="border-t border-neutral-100 pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                      <FiLink2 className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-700">Share Profile</h3>
                      <p className="text-xs text-neutral-500">Copy your public profile link</p>
                    </div>
                  </div>
                  <ProfileShareLink username={username} />
                </div>
              )}
            </div>
          </section>

          <ConnectedServicesSection connections={connections} />
        </div>

        <aside className="space-y-6">
          {!setupComplete && (
            <div className="card p-6">
              <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">Getting Started</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${username ? "bg-emerald-100 text-emerald-600" : "bg-neutral-100 text-neutral-400"}`}>
                    {username ? <FiCheckCircle className="h-4 w-4" /> : <span className="text-xs font-semibold">1</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Set your username</p>
                    <p className="text-xs text-neutral-500">Choose a unique username to create your public profile</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${connectedCount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-neutral-100 text-neutral-400"}`}>
                    {connectedCount > 0 ? <FiCheckCircle className="h-4 w-4" /> : <span className="text-xs font-semibold">2</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Connect a service</p>
                    <p className="text-xs text-neutral-500">Link at least one platform to showcase your skills</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                    <span className="text-xs font-semibold">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Share your profile</p>
                    <p className="text-xs text-neutral-500">Copy and share your profile link with others</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card bg-gradient-to-br from-teal-50 to-blue-50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">💡 Pro Tip</h3>
            <p className="text-xs leading-relaxed text-neutral-600">
              Connect multiple platforms to create a comprehensive developer profile. Your contributions from all platforms will be aggregated and displayed beautifully.
            </p>
          </div>

          {username && (
            <div className="card border-teal-200 bg-teal-50/50 p-6">
              <h3 className="mb-2 text-sm font-semibold text-teal-900">🎉 Profile is Live!</h3>
              <p className="mb-3 text-xs leading-relaxed text-teal-700">
                Your profile is now publicly accessible. Share it with recruiters, colleagues, and the community!
              </p>
              <a
                href={`/u/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                View your profile →
              </a>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
