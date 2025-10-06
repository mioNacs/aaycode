"use client";

import { useMemo } from "react";
import CalendarHeatmap, { type Value } from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

import type { ServiceContributionSeries } from "@/lib/contributions";

const palette = ["#e2e8f0", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9"];

type HeatmapValue = {
  date: string;
  count: number;
};

type PlatformHeatmapProps = {
  platformName: string;
  series: ServiceContributionSeries;
  compact?: boolean;
};

export function PlatformHeatmap({ platformName, series, compact = false }: PlatformHeatmapProps) {
  const samples = series.samples;

  const totalContributions = useMemo(
    () => samples.reduce((total, sample) => total + (sample.count ?? 0), 0),
    [samples]
  );

  const activeDays = useMemo(
    () => samples.filter((sample) => (sample.count ?? 0) > 0).length,
    [samples]
  );

  const maxCount = useMemo(
    () => samples.reduce((max, sample) => Math.max(max, sample.count ?? 0), 0),
    [samples]
  );

  const heatmapValues = useMemo<Value[]>(
    () =>
      samples.map((sample) => ({
        date: sample.date,
        count: sample.count ?? 0,
      })),
    [samples]
  );

  const startDate = series.startDate;
  const endDate = series.endDate;

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

    const { date, count } = heatmapValue;

    if (!count) {
      return `${date}: No contributions`;
    }

    return `${date}: ${count} contribution${count === 1 ? "" : "s"}`;
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

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h5 className="text-sm font-semibold text-[#0f172a]">{platformName} activity</h5>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="font-medium text-teal-600">{totalContributions} total</span>
            <span>{activeDays} active days</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={heatmapValues}
            gutterSize={2}
            showWeekdayLabels={false}
            classForValue={classForValue}
            titleForValue={titleForValue}
          />
        </div>
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
            rx: 3px;
            ry: 3px;
            shape-rendering: geometricPrecision;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-lg font-semibold text-[#0f172a]">{platformName} contributions</h4>
          <p className="text-xs text-neutral-500">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs">
            <p className="text-xs uppercase tracking-wide text-teal-600">Total</p>
            <p className="text-base font-semibold text-teal-700">{totalContributions}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Active</p>
            <p className="text-base font-semibold text-[#0f172a]">{activeDays}</p>
          </div>
        </div>
      </header>

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
                className="h-3 w-3 rounded"
                style={{ backgroundColor: color, border: "1px solid rgba(15, 23, 42, 0.06)" }}
              />
              {index === 0 && <span>0</span>}
              {index === palette.length - 1 && <span>Max</span>}
            </li>
          ))}
        </ul>
      </div>

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
    </div>
  );
}
