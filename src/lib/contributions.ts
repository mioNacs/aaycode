export type ContributionSource = "github" | "leetcode" | "codeforces" | "codechef" | "geeksforgeeks";

export type ContributionDay = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type ServiceContributionSeries = {
  startDate: string;
  endDate: string;
  samples: ContributionDay[];
};

export type ContributionSample = {
  date: string;
  total: number;
  sources: Partial<Record<ContributionSource, number>>;
};

export type ContributionSeries = {
  startDate: string;
  endDate: string;
  samples: ContributionSample[];
};

export type MergeContributionInput = Partial<Record<ContributionSource, ServiceContributionSeries | null | undefined>>;

const ISO_DATE_LENGTH = 10;
const MS_PER_DAY = 86_400_000;

const toDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const [year, month, day] = value.slice(0, ISO_DATE_LENGTH).split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
};

export const toISODateString = (value: Date | string): string => {
  const date = toDate(value);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const compareDates = (a: string | Date, b: string | Date): number => {
  return toDate(a).getTime() - toDate(b).getTime();
};

const addDays = (value: string | Date, amount: number): Date => {
  const date = toDate(value);
  return new Date(date.getTime() + amount * MS_PER_DAY);
};

const differenceInCalendarDays = (start: string | Date, end: string | Date): number => {
  const startMs = toDate(start).getTime();
  const endMs = toDate(end).getTime();
  return Math.round((endMs - startMs) / MS_PER_DAY);
};

export const ensureRangeOrder = (start: string, end: string): { start: string; end: string } => {
  if (compareDates(end, start) < 0) {
    return { start: toISODateString(end), end: toISODateString(start) };
  }

  return { start: toISODateString(start), end: toISODateString(end) };
};

export const generateDateRange = (start: string, end: string): string[] => {
  const normalized = ensureRangeOrder(start, end);
  const totalDays = differenceInCalendarDays(normalized.start, normalized.end);

  return Array.from({ length: totalDays + 1 }).map((_, index) =>
    toISODateString(addDays(normalized.start, index))
  );
};

export const normalizeSamples = (series: ServiceContributionSeries, start: string, end: string): ContributionDay[] => {
  const normalizedRange = ensureRangeOrder(start, end);
  const minDate = toDate(normalizedRange.start).getTime();
  const maxDate = toDate(normalizedRange.end).getTime();
  const values = new Map<string, number>();

  series.samples.forEach((sample) => {
    const date = toISODateString(sample.date);
    const dateMs = toDate(date).getTime();

    if (dateMs < minDate || dateMs > maxDate) {
      return;
    }

    values.set(date, sample.count ?? 0);
  });

  return generateDateRange(normalizedRange.start, normalizedRange.end).map((date) => ({
    date,
    count: values.get(date) ?? 0,
  }));
};

export const mergeContributionSeries = (
  input: MergeContributionInput,
  start: string,
  end: string
): ContributionSeries => {
  const normalized = ensureRangeOrder(start, end);
  const days = generateDateRange(normalized.start, normalized.end);

  const samples = days.map<ContributionSample>((date) => ({
    date,
    total: 0,
    sources: {},
  }));

  const indexMap = new Map<string, ContributionSample>();
  samples.forEach((sample) => {
    indexMap.set(sample.date, sample);
  });

  (Object.entries(input) as Array<[ContributionSource, ServiceContributionSeries | null | undefined]>).forEach(
    ([source, series]) => {
      if (!series) {
        return;
      }

      const normalizedSamples = normalizeSamples(series, normalized.start, normalized.end);

      normalizedSamples.forEach(({ date, count }) => {
        const sample = indexMap.get(date);

        if (!sample) {
          return;
        }

        sample.sources[source] = (sample.sources[source] ?? 0) + count;
        sample.total += count;
      });
    }
  );

  return {
    startDate: normalized.start,
    endDate: normalized.end,
    samples,
  };
};
