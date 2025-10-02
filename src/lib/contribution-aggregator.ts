import type { UserWithId } from "./users";
import {
  ensureRangeOrder,
  mergeContributionSeries,
  toISODateString,
  type ContributionSeries,
  type MergeContributionInput,
} from "./contributions";
import { getGitHubContributionSeriesForUser } from "./github/contributions";
import { getLeetCodeContributionSeriesForUser } from "./leetcode/contributions";

const MS_PER_DAY = 86_400_000;
const MAX_WINDOW_DAYS = 365;

const clampRange = (start: string, end: string): { start: string; end: string } => {
  const normalized = ensureRangeOrder(start, end);
  const startDate = new Date(`${normalized.start}T00:00:00Z`);
  const endDate = new Date(`${normalized.end}T00:00:00Z`);
  const windowSizeDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);

  if (windowSizeDays <= MAX_WINDOW_DAYS) {
    return normalized;
  }

  const clampedStart = new Date(endDate.getTime() - MAX_WINDOW_DAYS * MS_PER_DAY);
  return ensureRangeOrder(toISODateString(clampedStart), normalized.end);
};

const computeDefaultRange = (): { start: string; end: string } => {
  const today = new Date();
  const year = today.getUTCFullYear();
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));

  return ensureRangeOrder(toISODateString(startDate), toISODateString(endDate));
};

export type ContributionAggregationOptions = {
  start?: string;
  end?: string;
};

export type ContributionAggregationResult = {
  series: ContributionSeries;
  warnings: string[];
};

export const getContributionSeriesForUser = async (
  user: UserWithId,
  options: ContributionAggregationOptions = {}
): Promise<ContributionAggregationResult> => {
  const fallbackRange = computeDefaultRange();
  const requestedStart = options.start ?? fallbackRange.start;
  const requestedEnd = options.end ?? fallbackRange.end;
  const baseRange = ensureRangeOrder(requestedStart, requestedEnd);

  const targetRange = clampRange(baseRange.start, baseRange.end);
  const sources: MergeContributionInput = {};
  const warnings: string[] = [];

  const githubConnection = user.connections?.github;

  if (githubConnection?.username) {
    const githubSeries = await getGitHubContributionSeriesForUser(
      user._id.toString(),
      githubConnection.username,
      targetRange.start,
      targetRange.end
    );

    if (githubSeries) {
      if (githubSeries.samples.length === 0) {
        warnings.push("GitHub contributions returned no data for the requested range.");
      }
      sources.github = githubSeries;
    } else {
      warnings.push("GitHub contributions unavailable.");
    }
  } else {
    warnings.push("GitHub not connected.");
  }

  const leetCodeConnection = user.connections?.leetcode;

  if (leetCodeConnection?.username) {
    const leetCodeSeries = await getLeetCodeContributionSeriesForUser(
      user._id.toString(),
      leetCodeConnection.username,
      targetRange.start,
      targetRange.end
    );

    if (leetCodeSeries) {
      if (leetCodeSeries.samples.length === 0) {
        warnings.push("LeetCode contributions returned no data for the requested range.");
      }

      sources.leetcode = leetCodeSeries;
    } else {
      warnings.push("LeetCode contributions unavailable.");
    }
  } else {
    warnings.push("LeetCode not connected.");
  }

  const aggregated = mergeContributionSeries(sources, targetRange.start, targetRange.end);

  return {
    series: aggregated,
    warnings,
  };
};
