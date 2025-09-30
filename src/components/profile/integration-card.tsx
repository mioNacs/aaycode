import type { ReactNode } from "react";
import Link from "next/link";
import { FiExternalLink } from "react-icons/fi";

import type { IntegrationStatus, StatItem } from "@/lib/integrations";

const statusStyles: Record<IntegrationStatus, string> = {
  connected: "bg-emerald-100 text-emerald-700",
  disconnected: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
};

const statusLabels: Record<IntegrationStatus, string> = {
  connected: "Connected",
  disconnected: "Not connected",
  error: "Sync error",
};

const formatDateLabel = (date?: Date | null): string | null => {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export type IntegrationCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  status: IntegrationStatus;
  username?: string;
  stats: StatItem[];
  note?: string;
  lastSyncedAt?: Date | null;
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
};

export function IntegrationCard({
  icon,
  title,
  description,
  status,
  username,
  stats,
  note,
  lastSyncedAt,
  cta,
}: IntegrationCardProps) {
  const statusClassName = statusStyles[status];
  const statusLabel = statusLabels[status];
  const lastSyncedLabel = formatDateLabel(lastSyncedAt);

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
      <div className="space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              {icon}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">{title}</h3>
              <p className="text-xs uppercase tracking-wide text-neutral-400">{description}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName}`}>
            {statusLabel}
          </span>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-[#0f172a]">{stat.value}</p>
              {stat.helper ? (
                <p className="text-xs text-neutral-500">{stat.helper}</p>
              ) : null}
            </div>
          ))}
        </div>

        {note ? <p className="text-sm text-neutral-500">{note}</p> : null}
      </div>

      <footer className="mt-6 flex items-center justify-between gap-2 text-sm text-neutral-600">
        <div className="space-y-1">
          {username ? (
            <p className="font-medium text-neutral-700">@{username}</p>
          ) : null}
          {lastSyncedLabel ? (
            <p className="text-xs text-neutral-400">Last synced: {lastSyncedLabel}</p>
          ) : null}
        </div>
        <Link
          className="inline-flex items-center gap-1 rounded-full border border-teal-200 px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700"
          href={cta.href}
          target={cta.external ? "_blank" : undefined}
          rel={cta.external ? "noreferrer" : undefined}
        >
          {cta.label}
          {cta.external ? <FiExternalLink className="h-4 w-4" /> : null}
        </Link>
      </footer>
    </article>
  );
}
