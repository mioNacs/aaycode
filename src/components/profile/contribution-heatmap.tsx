"use client";

import { useMemo, useState } from "react";
import CalendarHeatmap, { type Value } from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

import type { ContributionSeries, ContributionSource } from "@/lib/contributions";

const SOURCE_LABELS: Record<ContributionSource, string> = {
  github: "GitHub",
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  geeksforgeeks: "GeeksforGeeks",
};

const SOURCE_COLORS: Record<ContributionSource, string[]> = {
  github: ["#e2e8f0", "#c3dafe", "#a3bffa", "#7f9cf5", "#5a67d8"],
  leetcode: ["#e2e8f0", "#fed7aa", "#fdba74", "#fb923c", "#f97316"],
  codeforces: ["#e2e8f0", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6"],
  codechef: ["#e2e8f0", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706"],
  geeksforgeeks: ["#e2e8f0", "#86efac", "#4ade80", "#22c55e", "#16a34a"],
};

type HeatmapValue = {
  date: string;
  count: number;
  sources: ContributionSeries["samples"][number]["sources"];
};

type ContributionHeatmapProps = {
  username: string;
  series: ContributionSeries;
  warnings?: string[];
};

export function ContributionHeatmap({ username, series, warnings = [] }: ContributionHeatmapProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<ContributionSource | "all">("all");
  
  const samples = series.samples;
  const trimmedUsername = username.trim();
  const possessiveLabel = trimmedUsername.endsWith("s")
    ? `${trimmedUsername}'`
    : `${trimmedUsername}'s`;

  const filteredSamples = useMemo(() => {
    if (selectedPlatform === "all") {
      return samples;
    }
    
    return samples.map((sample) => ({
      ...sample,
      total: sample.sources[selectedPlatform] ?? 0,
      sources: { [selectedPlatform]: sample.sources[selectedPlatform] ?? 0 },
    }));
  }, [samples, selectedPlatform]);

  const totalContributions = useMemo(
    () => filteredSamples.reduce((total, sample) => total + (sample.total ?? 0), 0),
    [filteredSamples]
  );

  const activeDays = useMemo(
    () => filteredSamples.filter((sample) => (sample.total ?? 0) > 0).length,
    [filteredSamples]
  );

  const maxCount = useMemo(
    () => filteredSamples.reduce((max, sample) => Math.max(max, sample.total ?? 0), 0),
    [filteredSamples]
  );

  const heatmapValues = useMemo<Value[]>(
    () =>
      filteredSamples.map((sample) => ({
        date: sample.date,
        count: sample.total ?? 0,
        sources: sample.sources,
      })),
    [filteredSamples]
  );

  const startDate = series.startDate;
  const endDate = series.endDate;
  const totalDays = samples.length;

  const classForValue = (value: Value) => {
    const heatmapValue = value as HeatmapValue | null | undefined;

    if (!heatmapValue || !heatmapValue.count || maxCount === 0) {
      return "color-empty";
    }

    const bucket = Math.min(4, Math.max(1, Math.ceil((heatmapValue.count / maxCount) * 4)));
    return `color-scale-${bucket}`;
  };

  const titleForValue = (value: Value) => {
    const heatmapValue = value as HeatmapValue | null | undefined;

    if (!heatmapValue) {
      return undefined;
    }

    const { date, count, sources } = heatmapValue;

    if (!count) {
      return `${date}: No recorded contributions`;
    }

    const sourceEntries = Object.entries(sources) as Array<[
      ContributionSource,
      number | undefined
    ]>;

    const sourceBreakdown = sourceEntries
      .filter(([, valueCount]) => typeof valueCount === "number" && valueCount > 0)
      .map(([key, valueCount]) => `${SOURCE_LABELS[key]}: ${valueCount}`)
      .join(" • ");

    return sourceBreakdown
      ? `${date}: ${count} total (${sourceBreakdown})`
      : `${date}: ${count} total`;
  };

  const rangeLabel = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00Z`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const end = new Date(`${endDate}T00:00:00Z`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${start} → ${end}`;
  }, [startDate, endDate]);

  const palette = selectedPlatform === "all" 
    ? ["#e2e8f0", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9"]
    : SOURCE_COLORS[selectedPlatform];

  const availablePlatforms = useMemo(() => {
    const platforms = new Set<ContributionSource>();
    samples.forEach((sample) => {
      Object.keys(sample.sources).forEach((source) => {
        if (sample.sources[source as ContributionSource]) {
          platforms.add(source as ContributionSource);
        }
      });
    });
    return Array.from(platforms);
  }, [samples]);

  return (
    <section className="card space-y-6 p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-teal-500">Recent activity</p>
          <h2 className="text-2xl font-semibold text-[#0f172a]">
            {possessiveLabel} contribution heatmap
          </h2>
          <p className="text-sm text-neutral-500">Covering the last {totalDays} days ({rangeLabel}).</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            <p className="text-xs uppercase tracking-wide text-teal-600">Total contributions</p>
            <p className="text-lg font-semibold text-teal-700">{totalContributions}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Active days</p>
            <p className="text-lg font-semibold text-[#0f172a]">{activeDays}</p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Filter by platform:</span>
          <button
            onClick={() => setSelectedPlatform("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selectedPlatform === "all"
                ? "bg-teal-100 text-teal-700 ring-2 ring-teal-300"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            All Platforms
          </button>
          {availablePlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedPlatform === platform
                  ? "bg-teal-100 text-teal-700 ring-2 ring-teal-300"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {SOURCE_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={heatmapValues}
          gutterSize={3}
          showWeekdayLabels
          classForValue={classForValue}
          titleForValue={titleForValue}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        <span>Intensity</span>
        <ul className="flex items-center gap-2">
          {palette.map((color, index) => (
            <li key={color} className="flex items-center gap-1">
              <span
                className="h-4 w-4 rounded"
                style={{ backgroundColor: color, border: "1px solid rgba(15, 23, 42, 0.06)" }}
              />
              {index === 0 && <span>0</span>}
              {index === palette.length - 1 && <span className="whitespace-nowrap">Max</span>}
            </li>
          ))}
        </ul>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Heads up</p>
          <ul className="list-inside list-disc space-y-1">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx global>{`
        .react-calendar-heatmap text {
          fill: #94a3b8;
          font-size: 10px;
        }

        .react-calendar-heatmap .color-empty {
          fill: ${palette[0]};
        }

        .react-calendar-heatmap .color-scale-1 {
          fill: ${palette[1]};
        }

        .react-calendar-heatmap .color-scale-2 {
          fill: ${palette[2]};
        }

        .react-calendar-heatmap .color-scale-3 {
          fill: ${palette[3]};
        }

        .react-calendar-heatmap .color-scale-4 {
          fill: ${palette[4]};
        }

        .react-calendar-heatmap rect {
          rx: 4px;
          ry: 4px;
          shape-rendering: geometricPrecision;
        }
      `}</style>
    </section>
  );
}
