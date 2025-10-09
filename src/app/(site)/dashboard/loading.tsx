type SkeletonBlockProps = {
  className?: string;
};

const SkeletonBlock = ({ className = "" }: SkeletonBlockProps) => (
  <div className={`rounded-md bg-neutral-200 animate-pulse ${className}`} />
);

const DashboardHeaderSkeleton = () => (
  <div className="space-y-2">
    <SkeletonBlock className="h-9 w-64 rounded-lg" />
    <SkeletonBlock className="h-5 w-96 rounded" />
  </div>
);

const IntegrationCardSkeleton = () => (
  <article className="card space-y-6 p-8">
    {/* Card Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-32 rounded" />
          <SkeletonBlock className="h-4 w-24 rounded" />
        </div>
      </div>
      <SkeletonBlock className="h-6 w-24 rounded-full" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`stat-${index}`} className="space-y-2">
          <SkeletonBlock className="h-3 w-20 rounded" />
          <SkeletonBlock className="h-5 w-16 rounded" />
        </div>
      ))}
    </div>

    {/* Action Button */}
    <div className="flex justify-between items-center pt-2">
      <SkeletonBlock className="h-4 w-32 rounded" />
      <SkeletonBlock className="h-10 w-36 rounded-full" />
    </div>
  </article>
);

const SettingsSectionSkeleton = () => (
  <section className="space-y-6">
    <div className="space-y-2">
      <SkeletonBlock className="h-7 w-48 rounded-lg" />
      <SkeletonBlock className="h-4 w-80 rounded" />
    </div>

    <div className="card p-8 space-y-6">
      {/* Username Setting */}
      <div className="space-y-3">
        <SkeletonBlock className="h-5 w-32 rounded" />
        <SkeletonBlock className="h-10 w-full max-w-md rounded-lg" />
        <SkeletonBlock className="h-4 w-64 rounded" />
      </div>

      {/* Account Actions */}
      <div className="pt-4 border-t border-neutral-200 space-y-3">
        <SkeletonBlock className="h-5 w-40 rounded" />
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  </section>
);

export default function DashboardLoading() {
  return (
    <main className="container flex min-h-[70vh] flex-col gap-12 py-16">
      <DashboardHeaderSkeleton />

      {/* Connected Services Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-56 rounded-lg" />
          <SkeletonBlock className="h-4 w-96 rounded" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <IntegrationCardSkeleton key={`integration-${index}`} />
          ))}
        </div>
      </section>

      {/* Settings Section */}
      <SettingsSectionSkeleton />
    </main>
  );
}
