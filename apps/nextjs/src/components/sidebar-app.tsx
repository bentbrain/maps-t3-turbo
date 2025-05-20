import { Suspense } from "react";
import { unstable_cache as cache } from "next/cache";
import { getInitialData } from "@/lib/get-initial-data";
import { caller } from "@/trpc/server";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

import { SidebarClientList } from "./sidebar-client-list";
import { SidebarButtonWrapper } from "./sidebar-dynamic-wrapper";
import { SidebarUserLocation } from "./sidebar-user-location";

export async function AppSidebar({
  params,
}: {
  params: Promise<{ databaseId: string; userId: string }>;
}) {
  const { databaseId, userId } = await params;

  const properties = await caller.user.getDatabaseProperties({
    databaseId: databaseId,
    userId: userId,
  });

  const cachedResult = cache(
    async () => {
      const result = await getInitialData({ databaseId });
      return result;
    },
    [databaseId],
    {
      tags: [databaseId],
    },
  );

  const result = await cachedResult();

  if (!result.success) {
    return null;
  }

  return (
    <Sidebar side="left">
      <SidebarHeader>
        <SidebarUserLocation />
      </SidebarHeader>
      <SidebarContent className="stable-gutter">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <SidebarClientList
            locations={result.locations}
            properties={properties}
          />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense
          fallback={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <SidebarButtonWrapper databaseId={databaseId} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
