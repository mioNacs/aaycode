import { PageLoadingState } from "@/components/ui/page-loading-state";

export default function DashboardLoading() {
  return (
    <PageLoadingState
      title="Loading your dashboard"
      message="Syncing your integrations and settings."
    />
  );
}
