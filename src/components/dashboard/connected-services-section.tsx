import type { ReactNode } from "react";

import { ConnectGitHubButton } from "@/components/connect-github-button";
import type { UserConnections } from "@/lib/users";

import { ConnectLeetCodeButton } from "./connect-leetcode-button";
import { DisconnectGitHubButton } from "./disconnect-github-button";
import { DisconnectLeetCodeButton } from "./disconnect-leetcode-button";
import { ConnectCodeforcesButton } from "./connect-codeforces-button";
import { DisconnectCodeforcesButton } from "./disconnect-codeforces-button";
import { ConnectCodechefButton } from "./connect-codechef-button";
import { DisconnectCodechefButton } from "./disconnect-codechef-button";
import { ConnectGeeksforgeeksButton } from "./connect-geeksforgeeks-button";
import { DisconnectGeeksforgeeksButton } from "./disconnect-geeksforgeeks-button";
import { SyncIntegrationButton } from "./sync-integration-button";

type ConnectedServicesSectionProps = {
  connections?: UserConnections;
};

type ServiceRowProps = {
  title: string;
  description: string;
  action: ReactNode;
  helper?: ReactNode;
};

const formatLastSynced = (value?: Date | string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ServiceRow = ({ title, description, action, helper }: ServiceRowProps) => (
  <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1 text-sm text-neutral-600">
      <p className="text-base font-semibold text-[#0f172a]">{title}</p>
      <p className="text-neutral-500">{description}</p>
      {helper ? <div className="text-xs text-neutral-400">{helper}</div> : null}
    </div>
    {action}
  </div>
);

export function ConnectedServicesSection({ connections }: ConnectedServicesSectionProps) {
  const githubConnection = connections?.github;
  const githubLastSynced = githubConnection?.lastSyncedAt
    ? formatLastSynced(githubConnection.lastSyncedAt)
    : null;
  const githubStatus = githubConnection
    ? githubConnection.username
      ? `Connected as @${githubConnection.username}`
      : "Connected"
    : "Not connected";
  const githubHelper = githubConnection?.lastSyncedAt
    ? githubLastSynced
      ? `Last synced ${githubLastSynced}`
      : "Sync time unavailable."
    : "Link your GitHub account to import repositories, stars, and followers.";
  const leetCodeConnection = connections?.leetcode;
  const leetCodeLastSynced = leetCodeConnection?.lastSyncedAt
    ? formatLastSynced(leetCodeConnection.lastSyncedAt)
    : null;
  const codeforcesConnection = connections?.codeforces;
  const codeforcesLastSynced = codeforcesConnection?.lastSyncedAt
    ? formatLastSynced(codeforcesConnection.lastSyncedAt)
    : null;
  const codechefConnection = connections?.codechef;
  const codechefLastSynced = codechefConnection?.lastSyncedAt
    ? formatLastSynced(codechefConnection.lastSyncedAt)
    : null;
  const geeksforgeeksConnection = connections?.geeksforgeeks;
  const geeksforgeeksLastSynced = geeksforgeeksConnection?.lastSyncedAt
    ? formatLastSynced(geeksforgeeksConnection.lastSyncedAt)
    : null;

  return (
    <section className="card max-w-3xl space-y-6 p-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[#0f172a]">Manage connected services</h2>
        <p className="text-sm text-neutral-500">
          Link developer platforms to enrich your public profile. Disconnect at any time to revoke
          access.
        </p>
      </header>

      <div className="space-y-4">
        <ServiceRow
          title="GitHub"
          description={githubStatus}
          helper={githubHelper}
          action={
            githubConnection ? (
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                <ConnectGitHubButton
                  connected
                  username={githubConnection.username}
                />
                <SyncIntegrationButton
                  endpoint="/api/integrations/github/sync"
                  serviceName="GitHub"
                />
                <DisconnectGitHubButton />
              </div>
            ) : (
              <ConnectGitHubButton connected={false} />
            )
          }
        />

        <ServiceRow
          title="LeetCode"
          description={
            leetCodeConnection?.username
              ? `Connected as @${leetCodeConnection.username}`
              : "Not connected"
          }
          helper={
            leetCodeConnection?.lastSyncedAt
              ? leetCodeLastSynced
                ? `Last synced ${leetCodeLastSynced}`
                : "Sync time unavailable."
              : "Add your LeetCode username to showcase solved problems and contest rating."
          }
          action={
            leetCodeConnection ? (
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                <ConnectLeetCodeButton username={leetCodeConnection.username} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/leetcode/sync"
                  serviceName="LeetCode"
                />
                <DisconnectLeetCodeButton />
              </div>
            ) : (
              <ConnectLeetCodeButton username={null} />
            )
          }
        />

        <ServiceRow
          title="Codeforces"
          description={
            codeforcesConnection?.handle
              ? `Connected as @${codeforcesConnection.handle}`
              : "Not connected"
          }
          helper={
            codeforcesConnection?.lastSyncedAt
              ? codeforcesLastSynced
                ? `Last synced ${codeforcesLastSynced}`
                : "Sync time unavailable."
              : "Add your Codeforces handle to surface rating, rank, and recent contest placements."
          }
          action={
            codeforcesConnection ? (
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                <ConnectCodeforcesButton handle={codeforcesConnection.handle} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/codeforces/sync"
                  serviceName="Codeforces"
                />
                <DisconnectCodeforcesButton />
              </div>
            ) : (
              <ConnectCodeforcesButton handle={null} />
            )
          }
        />

        <ServiceRow
          title="CodeChef"
          description={
            codechefConnection?.username
              ? `Connected as @${codechefConnection.username}`
              : "Not connected"
          }
          helper={
            codechefConnection?.lastSyncedAt
              ? codechefLastSynced
                ? `Last synced ${codechefLastSynced}`
                : "Sync time unavailable."
              : "Link CodeChef to surface ratings, stars, and solved problems."
          }
          action={
            codechefConnection ? (
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                <ConnectCodechefButton username={codechefConnection.username} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/codechef/sync"
                  serviceName="CodeChef"
                />
                <DisconnectCodechefButton />
              </div>
            ) : (
              <ConnectCodechefButton username={null} />
            )
          }
        />

        <ServiceRow
          title="GeeksforGeeks"
          description={
            geeksforgeeksConnection?.username
              ? `Connected as @${geeksforgeeksConnection.username}`
              : "Not connected"
          }
          helper={
            geeksforgeeksConnection?.lastSyncedAt
              ? geeksforgeeksLastSynced
                ? `Last synced ${geeksforgeeksLastSynced}`
                : "Sync time unavailable."
              : "Connect GeeksforGeeks to showcase coding score, solved problems, and ranks."
          }
          action={
            geeksforgeeksConnection ? (
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
                <ConnectGeeksforgeeksButton username={geeksforgeeksConnection.username} />
                <SyncIntegrationButton
                  endpoint="/api/integrations/geeksforgeeks/sync"
                  serviceName="GeeksforGeeks"
                />
                <DisconnectGeeksforgeeksButton />
              </div>
            ) : (
              <ConnectGeeksforgeeksButton username={null} />
            )
          }
        />
      </div>
    </section>
  );
}
