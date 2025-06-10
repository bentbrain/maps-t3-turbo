import { Suspense } from "react";
import { unstable_cache as cache } from "next/cache";
import { redirect } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { AppSidebar } from "@/components/sidebar-app";
import { RightSidebarTrigger } from "@/components/sidebar-dynamic-wrapper";
import { PageSidebar } from "@/components/sidebar-page";
import { encodeDatabaseParams } from "@/lib/database-hash";
import { getInitialData } from "@/lib/get-initial-data";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { MultiSidebarProvider } from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ userId: string; databaseId: string }>;
}>) {
  return (
    <AuthProtect params={params}>
      <MultiSidebarProvider defaultRightOpen={false}>
        <AppSidebar params={params} />
        <div className="grid h-dvh w-full grid-rows-[auto_1fr]">
          <header className="bg-background grid grid-cols-[auto_1fr_auto] gap-6 p-3">
            <div className="flex justify-start">
              <RightSidebarTrigger />
            </div>
            <div className="mx-auto flex w-52 gap-2">
              <Suspense
                fallback={<Skeleton className="mx-auto h-9 w-full max-w-sm" />}
              >
                <DynamicSearch params={params} />
              </Suspense>
            </div>
            <div className="ml-auto flex w-full justify-end">
              <SignedOut>
                <SignInButton />
                <SignUpButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </div>
        <PageSidebar />
      </MultiSidebarProvider>
    </AuthProtect>
  );
}

const DynamicSearch = async ({
  params,
}: {
  params: Promise<{ userId: string; databaseId: string }>;
}) => {
  const { userId, databaseId } = await params;
  const { userId: clerkUserId } = await auth();

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

  if (clerkUserId !== userId) {
    redirect("/");
  }

  if (!result.success) {
    return null;
  }

  // Generate share hash for the database
  const shareHash = encodeDatabaseParams(userId, databaseId);

  return (
    <SearchBar
      userId={userId}
      selectedDatabaseId={databaseId}
      locations={result.locations}
      shareHash={shareHash}
    />
  );
};

export const AuthProtect = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string; databaseId: string }>;
}) => {
  const { userId, databaseId } = await params;

  const validDatabaseId = z.string().uuid().safeParse(databaseId);

  if (!validDatabaseId.success) {
    redirect("/");
  }

  const { userId: clerkUserId } = await auth();

  if (clerkUserId !== userId) {
    redirect("/");
  }

  return <>{children}</>;
};
