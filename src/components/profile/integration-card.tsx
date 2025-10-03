"use client";
import { FaX } from "react-icons/fa6";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { FiExternalLink, FiX } from "react-icons/fi";

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

const isUrl = (value?: string | null): value is string => {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value);
};

const renderInsightValue = (value?: string | null) => {
  if (!value || value === "—") {
    return <span className="text-neutral-500">—</span>;
  }

  if (isUrl(value)) {
    return (
      <a
        className="text-sm font-medium text-teal-600 underline-offset-2 hover:underline"
        href={value}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        {value}
      </a>
    );
  }

  return <span className="text-base font-medium text-[#0f172a]">{value}</span>;
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
  avatarUrl?: string | null;
  profileUrl?: string | null;
  insights?: StatItem[];
  detailContent?: ReactNode;
  cta: {
    label: string;
    href: string;
    external?: boolean;
  };
};

const renderStatCard = (stat: StatItem, variant: "card" | "modal") => {
  const baseClass =
    variant === "card"
      ? "rounded-xl bg-neutral-50 px-4 py-3"
      : "rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm";

  return (
    <div key={`${variant}-${stat.label}`} className={baseClass}>
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {stat.label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[#0f172a]">{stat.value}</p>
      {stat.helper ? (
        <p className="text-xs text-neutral-500">{stat.helper}</p>
      ) : null}
    </div>
  );
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
  avatarUrl,
  profileUrl,
  insights,
  detailContent,
  cta,
}: IntegrationCardProps) {
  const statusClassName = statusStyles[status];
  const statusLabel = statusLabels[status];
  const lastSyncedLabel = formatDateLabel(lastSyncedAt);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPortalReady, setIsPortalReady] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    setIsPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDialogOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDialogOpen]);

  useEffect(() => {
    if (isDialogOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isDialogOpen]);

  const handleOpen = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleCardKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen]
  );

  const modalInsights = useMemo(
    () => insights?.filter((item) => item.value && item.value !== "—"),
    [insights]
  );

  const hasModalContent = Boolean(
    (stats && stats.length > 0) ||
      note ||
      modalInsights?.length ||
      detailContent ||
      username ||
      profileUrl ||
      avatarUrl ||
      lastSyncedLabel
  );

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-haspopup={hasModalContent ? "dialog" : undefined}
        aria-expanded={hasModalContent ? isDialogOpen : undefined}
        onClick={hasModalContent ? handleOpen : undefined}
        onKeyDown={hasModalContent ? handleCardKeyDown : undefined}
        className="flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-teal-100 bg-white p-6 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
      >
        <div className="space-y-5">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                {icon}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">
                  {title}
                </h3>
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  {description}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName}`}
            >
              {statusLabel}
            </span>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map((stat) => renderStatCard(stat, "card"))}
          </div>

          {note ? <p className="text-sm text-neutral-500">{note}</p> : null}
        </div>

        <footer className="mt-6 flex items-center justify-between gap-2 text-sm text-neutral-600">
          <div className="space-y-1">
            {username ? (
              <p className="font-medium text-neutral-700">@{username}</p>
            ) : null}
            {lastSyncedLabel ? (
              <p className="text-xs text-neutral-400">
                Last synced: {lastSyncedLabel}
              </p>
            ) : null}
            {hasModalContent ? (
              <p className="text-xs text-neutral-400">
                Click to see the full breakdown
              </p>
            ) : null}
          </div>
          <Link
            className="inline-flex items-center gap-1 rounded-full border border-teal-200 px-4 py-2 text-sm font-medium text-teal-600 transition hover:border-teal-300 hover:text-teal-700"
            href={cta.href}
            target={cta.external ? "_blank" : undefined}
            rel={cta.external ? "noreferrer" : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            {cta.label}
            {cta.external ? <FiExternalLink className="h-4 w-4" /> : null}
          </Link>
        </footer>
      </article>

      {isPortalReady && isDialogOpen && hasModalContent
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 "
              onClick={handleClose}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="relative max-h-[90vh] overflow-auto w-full max-w-2xl rounded-3xl bg-white p-6 pt-0 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="sticky top-0 bg-white flex flex-col py-4 gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      {icon}
                    </span>
                    <div>
                      <h3
                        id={dialogTitleId}
                        className="text-xl font-semibold text-[#0f172a]"
                      >
                        {title}
                      </h3>
                      <p className="text-sm text-neutral-500">{description}</p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusClassName}`}
                    >
                      {statusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-800"
                    >
                      <FaX />
                    </button>
                  </div>
                </header>

                <div className="mt-6 space-y-6">
                  {(avatarUrl || username || profileUrl || lastSyncedLabel) && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={`${title} avatar`}
                              width={56}
                              height={56}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-lg font-semibold text-neutral-500">
                              {title.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {username ? (
                            <p className="text-base font-semibold text-[#0f172a]">
                              @{username}
                            </p>
                          ) : null}
                          {profileUrl ? (
                            <a
                              className="inline-flex items-center gap-1 text-sm font-medium text-white underline-offset-2 hover:underline"
                              href={profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                            >
                              View profile
                              <FiExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                      {lastSyncedLabel ? (
                        <p className="text-sm text-neutral-500">
                          Last synced {lastSyncedLabel}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    {stats.map((stat) => renderStatCard(stat, "modal"))}
                  </div>

                  {modalInsights?.length ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                        Highlights
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {modalInsights.map((item) => (
                          <div
                            key={`insight-${item.label}`}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                          >
                            <p className="text-xs uppercase tracking-wide text-neutral-500">
                              {item.label}
                            </p>
                            <div className="mt-1 flex flex-col gap-1 text-sm text-neutral-600">
                              {renderInsightValue(item.value)}
                              {item.helper ? (
                                <span className="text-xs text-neutral-500">
                                  {item.helper}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {detailContent ? <div>{detailContent}</div> : null}

                  {note ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      {note}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
