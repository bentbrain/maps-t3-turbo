import { Suspense } from "react";
import { unstable_cache as cache } from "next/cache";
import { redirect } from "next/navigation";
import { getInitialData } from "@/lib/get-initial-data";
import { caller, prefetch, trpc } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

import DatabaseSelect from "./database-select";
import { SidebarClientList } from "./sidebar-client-list";
import { SidebarButtonWrapper } from "./sidebar-dynamic-wrapper";

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
        <Suspense
          fallback={<Skeleton className="mx-auto h-9 w-full max-w-sm" />}
        >
          <DatabaseSelectWrapper params={params} />
        </Suspense>
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

const DatabaseSelectWrapper = async ({
  params,
}: {
  params: Promise<{ userId: string; databaseId: string }>;
}) => {
  const { userId, databaseId } = await params;
  const { userId: clerkUserId } = await auth();

  if (clerkUserId !== userId) {
    redirect("/");
  }

  const validDatabaseId = z.string().uuid().safeParse(databaseId);

  if (!validDatabaseId.success) {
    redirect("/");
  }

  prefetch(trpc.user.getUserDatabasesFromNotion.queryOptions());

  return <DatabaseSelect userId={userId} databaseId={databaseId} />;
};
