type PageLoadingStateProps = {
  title?: string;
  message?: string;
};

export function PageLoadingState({
  title = "Loading…",
  message = "Hang tight while we prepare the next page.",
}: PageLoadingStateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 py-16" role="status" aria-live="polite">
      <span
        className="h-14 w-14 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
      <div className="space-y-1 text-center">
        <p className="text-lg font-semibold text-[#0f172a]">{title}</p>
        {message ? <p className="text-sm text-neutral-500">{message}</p> : null}
      </div>
    </div>
  );
}
