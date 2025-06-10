import { Suspense } from "react";
import { unstable_cache as cache } from "next/cache";
import { encodeDatabaseParams } from "@/lib/database-hash";
import { getInitialData } from "@/lib/get-initial-data";
import { caller, prefetch, trpc } from "@/trpc/server";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuSkeleton,
} from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

import DatabaseSelect from "./database-select";
import { SidebarClientList } from "./sidebar-client-list";
import { SidebarButtonWrapper } from "./sidebar-dynamic-wrapper";

export function AppSidebar({
  params,
  showcase = false,
}: {
  params: Promise<{ databaseId: string; userId: string }>;
  showcase?: boolean;
}) {
  return (
    <Sidebar className="bg-white" variant="floating" side="left">
      <SidebarHeader className="stable-gutter overflow-auto">
        {showcase ? null : (
          <Suspense
            fallback={<Skeleton className="mx-auto h-9 w-full max-w-sm" />}
          >
            <DatabaseSelectWrapper params={params} />
          </Suspense>
        )}
      </SidebarHeader>
      <SidebarContent className="stable-gutter">
        <Suspense fallback={<SidebarMenuSkeleton />}>
          <DynamicContent params={params} />
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
          <DynamicFooter params={params} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

const DatabaseSelectWrapper = async ({
  params,
}: {
  params: Promise<{ userId: string; databaseId: string }>;
}) => {
  const { userId, databaseId } = await params;

  prefetch(trpc.user.getUserDatabasesFromNotion.queryOptions());

  return <DatabaseSelect userId={userId} databaseId={databaseId} />;
};

const DynamicContent = async ({
  params,
}: {
  params: Promise<{ databaseId: string; userId: string }>;
}) => {
  const { databaseId, userId } = await params;

  const properties = await caller.user.getDatabaseProperties({
    databaseId: databaseId,
    userId: userId,
  });

  const cachedResult = cache(
    async () => {
      const result = await getInitialData({ databaseId, userId });
      return result;
    },
    [databaseId, userId],
    {
      tags: [databaseId],
    },
  );

  const result = await cachedResult();

  if (!result.success) {
    return null;
  }

  return (
    <SidebarClientList locations={result.locations} properties={properties} />
  );
};

const DynamicFooter = async ({
  params,
}: {
  params: Promise<{ databaseId: string; userId: string }>;
}) => {
  const { databaseId, userId } = await params;

  // Generate share hash for the database
  const shareHash = encodeDatabaseParams(userId, databaseId);

  return <SidebarButtonWrapper databaseId={databaseId} shareHash={shareHash} />;
};
