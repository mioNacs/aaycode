type SkeletonBlockProps = {
  className?: string;
};

const SkeletonBlock = ({ className = "" }: SkeletonBlockProps) => (
  <div className={`rounded-md bg-neutral-200 animate-pulse ${className}`} />
);

const UserInfoSkeleton = () => (
  <header className="card space-y-6 p-10 md:w-[35vw]">
    <div className="flex flex-col gap-4">
      {/* Avatar and Name */}
      <div className="space-y-2">
        <SkeletonBlock className="h-20 w-20 rounded-xl" />
        <SkeletonBlock className="h-10 w-48 rounded-lg" />
        <SkeletonBlock className="h-4 w-32 rounded" />
      </div>

      {/* Badges */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-8 w-56 rounded-full bg-teal-100" />
        <SkeletonBlock className="h-8 w-44 rounded-full" />
      </div>
    </div>

    {/* Description */}
    <div className="flex flex-col gap-2">
      <SkeletonBlock className="h-4 w-full rounded" />
      <SkeletonBlock className="h-4 w-full rounded" />
      <SkeletonBlock className="h-4 w-3/4 rounded" />
    </div>
  </header>
);

const SummarySkeleton = () => (
  <section className="card flex-1 p-10">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`summary-skeleton-${index}`} className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <SkeletonBlock className="h-3 w-24 rounded" />
          <SkeletonBlock className="h-8 w-20 rounded" />
          <SkeletonBlock className="h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  </section>
);

const HeatmapSkeleton = () => (
  <section className="card space-y-6 p-10">
    <div className="flex flex-col gap-2">
      <SkeletonBlock className="h-6 w-64 rounded" />
      <SkeletonBlock className="h-4 w-96 rounded" />
    </div>

    {/* Heatmap Grid */}
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 52 }).map((_, i) => (
          <div key={`week-${i}`} className="flex flex-col gap-1 flex-shrink-0">
            {Array.from({ length: 7 }).map((_, j) => (
              <SkeletonBlock key={`day-${j}`} className="h-3 w-3 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center justify-end">
        <SkeletonBlock className="h-3 w-16 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={`legend-${i}`} className="h-3 w-3 rounded-sm" />
        ))}
      </div>
    </div>
  </section>
);

const IntegrationCardSkeleton = () => (
  <article className="card space-y-6 p-8">
    {/* Card Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-8 w-8 rounded" />
        <SkeletonBlock className="h-6 w-24 rounded" />
      </div>
      <SkeletonBlock className="h-6 w-20 rounded-full" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`stat-${index}`} className="space-y-2">
          <SkeletonBlock className="h-3 w-20 rounded" />
          <SkeletonBlock className="h-5 w-16 rounded" />
        </div>
      ))}
    </div>

    {/* Insight */}
    <div className="space-y-2">
      <SkeletonBlock className="h-4 w-full rounded" />
      <SkeletonBlock className="h-4 w-3/4 rounded" />
    </div>
  </article>
);

export default function ProfileLoading() {
  return (
    <main className="container flex min-h-[70vh] flex-col gap-12 py-16">
      {/* Profile Header and Summary Section */}
      <div className="flex flex-col md:flex-row gap-6">
        <UserInfoSkeleton />
        <SummarySkeleton />
      </div>

      {/* Contribution Heatmap */}
      <HeatmapSkeleton />

      {/* Connected Platforms Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64 rounded" />
          <SkeletonBlock className="h-4 w-96 rounded" />
        </div>

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <IntegrationCardSkeleton key={`integration-${index}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
