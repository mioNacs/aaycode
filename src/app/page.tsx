import Link from "next/link";
import { FiLink, FiTrendingUp, FiUser, FiUserPlus, FiSettings, FiShare2 } from "react-icons/fi";
import { getCurrentUserSession } from "../lib/auth";

export default async function Home() {
const session = await getCurrentUserSession();

const features = [
  {
    icon: FiLink,
    title: "Unify your coding footprint",
    description: "Pull stats from your favourite platforms and present them in a single shareable home.",
  },
  {
    icon: FiUser,
    title: "Showcase a custom username",
    description: "Claim a clean URL that's easy to share with hiring managers, friends, and mentors.",
  },
  {
    icon: FiTrendingUp,
    title: "Track progress over time",
    description: "Stay motivated with snapshots of how your problem-solving and projects evolve week to week.",
  },
];

const steps = [
  {
    icon: FiUserPlus,
    number: "1",
    title: "Create your account",
    body: "Sign up with Google, GitHub, or email/password. Your username is reserved instantly.",
  },
  {
    icon: FiSettings,
    number: "2",
    title: "Connect coding services",
    body: "Sync GitHub, LeetCode, Codeforces, and more (coming soon) to populate your profile automatically.",
  },
  {
    icon: FiShare2,
    number: "3",
    title: "Share your profile",
    body: "Send a single link that captures your progress, projects, and achievements at a glance.",
  },
];

  return (
    <div className="container flex min-h-[70vh] flex-col justify-center gap-10 py-16">
      <section className="container pt-12">
        <div className="flex flex-col gap-12 rounded-[32px] bg-white/80 p-10 shadow-[0_35px_80px_rgba(79,114,205,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6 md:max-w-2xl">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-4 py-1 text-sm font-medium text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              AyyCode Profiles
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-[#0f172a] sm:text-5xl">
              This... is how ‘I Code’.
            </h1>
            <p className="text-lg text-neutral-600">
              Stop juggling screenshots and spreadsheets. AyyCode pulls your stats together, keeps them
              fresh, and gives you a polished profile to share with the world.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {!session && <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-500"
            >
              <span className="text-white">Start for free</span>
            </Link>}
            {session && <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold transition hover:border-teal-500"
            >
              <span className="text-white">Explore the dashboard</span>
            </Link>}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6">
              <feature.icon className="mb-4 h-8 w-8 text-teal-600" />
              <h3 className="text-lg font-semibold text-[#0f172a]">{feature.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-10">
        <div className="rounded-[28px] bg-white/90 p-10 shadow-[0_35px_90px_rgba(99,102,241,0.08)] backdrop-blur">
          <h2 className="text-3xl font-semibold text-[#0f172a]">How it works</h2>
          <p className="mt-2 max-w-2xl text-neutral-600">
            AyyCode streamlines the way you share your progress. In just a few minutes you can stand up a
            professional-looking profile for recruiters, communities, or personal milestones.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="card flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                    {step.number}
                  </span>
                  <step.icon className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#0f172a]">{step.title}</h3>
                <p className="text-sm text-neutral-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
