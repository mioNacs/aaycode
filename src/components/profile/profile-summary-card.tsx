import type { IntegrationPreview, StatItem } from "@/lib/integrations";

const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

const parseMetric = (rawValue?: string | null): number | null => {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === "—") {
    return null;
  }

  const normalized = trimmed.replace(/,/g, "");
  const match = normalized.match(/(-?\d+(?:\.\d+)?)([kmb])?/i);

  if (!match) {
    return null;
  }

  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) {
    return null;
  }

  const suffix = match[2]?.toLowerCase();
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : suffix === "b" ? 1_000_000_000 : 1;

  return Math.round(base * multiplier);
};

const findStat = (preview: IntegrationPreview, label: string): StatItem | undefined => {
  return preview.stats.find((stat) => stat.label === label);
};

type MetricResult = {
  valueLabel: string;
  helper?: string;
};

type ProfileSummaryCardProps = {
  github: IntegrationPreview;
  leetcode: IntegrationPreview;
  codeforces: IntegrationPreview;
  codechef: IntegrationPreview;
  geeksforgeeks: IntegrationPreview;
  activity?: {
    longestStreak: number;
    consistencyScore: number;
    activeDaysInWindow: number;
    windowDays: number;
  };
};

const formatValue = (value: number | null): string => {
  if (value === null) {
    return "—";
  }

  return numberFormatter.format(value);
};

const buildHighestContestRating = (
  leetcode: IntegrationPreview,
  codeforces: IntegrationPreview,
  codechef: IntegrationPreview
): MetricResult => {
  const candidates: Array<{
    value: number;
    platform: string;
    helper?: string;
  }> = [];

  const leetcodeStat = findStat(leetcode, "Contest rating");
  const leetcodeValue = parseMetric(leetcodeStat?.value);
  if (leetcodeValue !== null) {
    candidates.push({ value: leetcodeValue, platform: "LeetCode", helper: leetcodeStat?.helper });
  }

  const codeforcesStat = findStat(codeforces, "Max rating");
  const codeforcesValue = parseMetric(codeforcesStat?.value)
    ?? parseMetric(findStat(codeforces, "Current rating")?.value);
  if (codeforcesValue !== null) {
    candidates.push({ value: codeforcesValue, platform: "Codeforces", helper: codeforcesStat?.helper });
  }

  const codechefStat = findStat(codechef, "Highest rating");
  const codechefValue = parseMetric(codechefStat?.value)
    ?? parseMetric(findStat(codechef, "Rating")?.value);
  if (codechefValue !== null) {
    const ratingHelper = findStat(codechef, "Rating")?.helper;
    candidates.push({ value: codechefValue, platform: "CodeChef", helper: ratingHelper });
  }

  if (!candidates.length) {
    return { valueLabel: "—" };
  }

  const best = candidates.reduce((prev, current) => (current.value > prev.value ? current : prev));
  const helper = [best.platform ? `Source: ${best.platform}` : undefined, best.helper].filter(Boolean).join(" · ") || undefined;

  return {
    valueLabel: formatValue(best.value),
    helper,
  };
};

const buildTotalProblemsSolved = (
  leetcode: IntegrationPreview,
  geeksforgeeks: IntegrationPreview,
  codechef: IntegrationPreview,
  codeforces: IntegrationPreview
): MetricResult => {
  const contributions: Array<{ platform: string; value: number }> = [];

  const leetcodeValue = parseMetric(findStat(leetcode, "Total solved")?.value);
  if (leetcodeValue !== null) {
    contributions.push({ platform: "LeetCode", value: leetcodeValue });
  }

  const gfgValue = parseMetric(findStat(geeksforgeeks, "Problems solved")?.value);
  if (gfgValue !== null) {
    contributions.push({ platform: "GeeksforGeeks", value: gfgValue });
  }

  const codechefValue = parseMetric(findStat(codechef, "Fully solved")?.value);
  if (codechefValue !== null) {
    contributions.push({ platform: "CodeChef", value: codechefValue });
  }

  const codeforcesValue = parseMetric(findStat(codeforces, "Problems solved")?.value);
  if (codeforcesValue !== null) {
    contributions.push({ platform: "Codeforces", value: codeforcesValue });
  }

  if (!contributions.length) {
    return { valueLabel: "—" };
  }

  const total = contributions.reduce((sum, entry) => sum + entry.value, 0);
  const helper = contributions
    .map((entry) => `${entry.platform} ${formatValue(entry.value)}`)
    .join(" · ");

  return {
    valueLabel: formatValue(total),
    helper,
  };
};

const buildGitHubMetric = (
  github: IntegrationPreview,
  label: string,
  helperFallback: string
): MetricResult => {
  const stat = findStat(github, label);
  const value = parseMetric(stat?.value);

  return {
    valueLabel: value === null ? "—" : formatValue(value),
    helper: value === null ? undefined : helperFallback,
  };
};

const buildLongestStreakMetric = (activity?: ProfileSummaryCardProps["activity"]): MetricResult => {
  if (!activity || activity.longestStreak <= 0) {
    return { valueLabel: "—" };
  }

  const days = activity.longestStreak;
  const helper = "Consecutive active days";

  return {
    valueLabel: `${days} ${days === 1 ? "day" : "days"}`,
    helper,
  };
};

const buildConsistencyMetric = (activity?: ProfileSummaryCardProps["activity"]): MetricResult => {
  if (!activity || activity.windowDays === 0) {
    return { valueLabel: "—" };
  }

  const { consistencyScore, activeDaysInWindow, windowDays } = activity;
  const helper = `${activeDaysInWindow}/${windowDays} active days (last ${windowDays} days)`;

  return {
    valueLabel: `${consistencyScore}%`,
    helper,
  };
};

const SummaryMetric = ({ label, value, helper }: { label: string; value: string; helper?: string }) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#0f172a]">{value}</p>
      {helper ? <p className="mt-2 text-sm text-neutral-500">{helper}</p> : null}
    </div>
  );
};

export function ProfileSummaryCard({
  github,
  leetcode,
  codeforces,
  codechef,
  geeksforgeeks,
  activity,
}: ProfileSummaryCardProps) {
  const highestContestRating = buildHighestContestRating(leetcode, codeforces, codechef);
  const totalProblemsSolved = buildTotalProblemsSolved(leetcode, geeksforgeeks, codechef, codeforces);
  const githubFollowers = buildGitHubMetric(github, "Followers", "Followers on GitHub");
  const githubStars = buildGitHubMetric(github, "Total stars", "Across public repositories");
  const longestStreakMetric = buildLongestStreakMetric(activity);
  const consistencyMetric = buildConsistencyMetric(activity);

  return (
    <section className="card space-y-6 p-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[#0f172a]">Profile summary</h2>
        <p className="text-sm text-neutral-500">
          A quick snapshot of standout milestones across your connected platforms.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryMetric
          label="Highest contest rating"
          value={highestContestRating.valueLabel}
          helper={highestContestRating.helper}
        />
        <SummaryMetric
          label="Total problems solved"
          value={totalProblemsSolved.valueLabel}
          helper={totalProblemsSolved.helper}
        />
        <SummaryMetric
          label="Longest streak"
          value={longestStreakMetric.valueLabel}
          helper={longestStreakMetric.helper}
        />
        <SummaryMetric
          label="Consistency score"
          value={consistencyMetric.valueLabel}
          helper={consistencyMetric.helper}
        />
        <SummaryMetric
          label="GitHub followers"
          value={githubFollowers.valueLabel}
          helper={githubFollowers.helper}
        />
        <SummaryMetric
          label="GitHub total stars"
          value={githubStars.valueLabel}
          helper={githubStars.helper}
        />
      </div>
    </section>
  );
}
