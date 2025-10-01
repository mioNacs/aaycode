type SkeletonBlockProps = {
  className?: string;
};

const SkeletonBlock = ({ className = "" }: SkeletonBlockProps) => (
  <div className={`rounded-md bg-neutral-200 ${className}`} />
);

const HeaderSkeleton = () => (
  <header className="card space-y-6 p-10">
    <div className="flex animate-pulse flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-32 rounded-full" />
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-40" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-44 rounded-full" />
        <SkeletonBlock className="h-8 w-36 rounded-full" />
      </div>
    </div>

    <div className="flex animate-pulse flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <SkeletonBlock className="h-4 w-full md:w-2/3" />
      <SkeletonBlock className="h-9 w-44 rounded-full" />
    </div>

    <div className="flex flex-wrap gap-2">
      <SkeletonBlock className="h-6 w-32 rounded-full" />
    </div>
  </header>
);

const SummarySkeleton = () => (
  <section className="card space-y-6 p-10">
    <div className="space-y-2 animate-pulse">
      <SkeletonBlock className="h-6 w-48" />
      <SkeletonBlock className="h-4 w-64" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`summary-skeleton-${index}`} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="space-y-3 animate-pulse">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-20" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  </section>
);

const IntegrationCardSkeleton = () => (
  <article className="flex h-full animate-pulse flex-col justify-between rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBlock className="h-6 w-24 rounded-full" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`stat-${index}`} className="rounded-xl bg-neutral-50 px-4 py-3">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-5 w-20" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      <SkeletonBlock className="h-3 w-40" />
    </div>

    <footer className="mt-6 flex items-center justify-between gap-2">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-28" />
      </div>
      <SkeletonBlock className="h-9 w-36 rounded-full" />
    </footer>
  </article>
);

export default function Loading() {
  return (
    <main className="container flex min-h-[70vh] flex-col gap-12 py-16">
      <HeaderSkeleton />
      <SummarySkeleton />
      <section className="space-y-6">
        <div className="space-y-2 animate-pulse">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <IntegrationCardSkeleton key={`integration-${index}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
