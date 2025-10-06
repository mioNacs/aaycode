import { PageLoadingState } from "@/components/ui/page-loading-state";

export default function RootLoading() {
  return (
    <PageLoadingState
      title="Loading AyyCode"
      message="We’re fetching the latest data for you."
    />
  );
}
