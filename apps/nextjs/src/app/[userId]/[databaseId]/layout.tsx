import { Suspense } from "react";
import { redirect } from "next/navigation";
import DatabaseSelect from "@/components/database-select";
import { AppSidebar } from "@/components/sidebar-app";
import { RightSidebarTrigger } from "@/components/sidebar-dynamic-wrapper";
import { PageSidebar } from "@/components/sidebar-page";
import { prefetch, trpc } from "@/trpc/server";
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
    <MultiSidebarProvider defaultRightOpen={false}>
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <AppSidebar params={params} />
      </Suspense>
      <div className="grid h-dvh w-full grid-rows-[auto_1fr]">
        <header className="bg-background grid grid-cols-[auto_1fr_auto] gap-6 p-3 group-has-[.disable-layout-features]/root:grid-cols-[auto_1fr]">
          <div className="flex justify-start">
            <RightSidebarTrigger />
          </div>
          <Suspense
            fallback={<Skeleton className="mx-auto h-9 w-full max-w-sm" />}
          >
            <DatabaseSelectWrapper params={params} />
          </Suspense>
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
