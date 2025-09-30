import { SiCodechef } from "react-icons/si";

import type { IntegrationPreview } from "@/lib/integrations";

import { IntegrationCard } from "./integration-card";

type CodechefCardProps = {
  data: IntegrationPreview;
};

export function CodechefCard({ data }: CodechefCardProps) {
  return (
    <IntegrationCard
      icon={<SiCodechef className="h-5 w-5" />}
      title="CodeChef"
      description="Ratings, stars, solved problems"
      status={data.status}
      username={data.username}
      stats={data.stats}
      note={data.note}
      lastSyncedAt={data.lastSyncedAt}
      cta={{
        label:
          data.status === "connected" && data.username
            ? "View profile"
            : "Connect CodeChef",
        href:
          data.status === "connected" && data.username
            ? `https://www.codechef.com/users/${data.username}`
            : "/dashboard",
        external: data.status === "connected" && Boolean(data.username),
      }}
    />
  );
}
