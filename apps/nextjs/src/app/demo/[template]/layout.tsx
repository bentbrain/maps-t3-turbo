import { Suspense } from "react";
import { unstable_cache as cache } from "next/cache";
import { notFound } from "next/navigation";
import SearchBar from "@/components/search-bar";
import { AppSidebar } from "@/components/sidebar-app";
import { RightSidebarTrigger } from "@/components/sidebar-dynamic-wrapper";
import { PageSidebar } from "@/components/sidebar-page";
import { getInitialData } from "@/lib/get-initial-data";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Notion } from "@ridemountainpig/svgl-react";
import { z } from "zod";

import { env } from "@acme/env/env";
import { Button } from "@acme/ui/button";
import { MultiSidebarProvider } from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

const paramSchema = z.object({
  template: z.enum(["tokyo", "rentals"]),
});

export type Template = z.infer<typeof paramSchema>;

export const templateDatabaseIds = {
  tokyo: "1fdf0b7d-51b9-800e-8c37-f25955217400",
  rentals: "1f0f0b7d-51b9-8136-8335-ffc4624bd517",
};

export default async function ShowcaseLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<Template>;
}>) {
  const parsedParams = paramSchema.safeParse(await params);
  if (!parsedParams.success) {
    return notFound();
  }

  const { template } = parsedParams.data;

  const showcaseParams = new Promise<{ userId: string; databaseId: string }>(
    (resolve) => {
      resolve({
        userId: env.ADMIN_NOTION_USER_ID,
        databaseId: templateDatabaseIds[template],
      });
    },
  );

  return (
    <MultiSidebarProvider defaultRightOpen={false}>
      <Suspense>
        <AppSidebar showcase params={showcaseParams} />
      </Suspense>
      <div className="grid h-dvh w-full grid-rows-[auto_1fr]">
        <header className="bg-background grid grid-cols-[auto_1fr_auto] gap-6 p-3">
          <div className="flex justify-start">
            <RightSidebarTrigger />
          </div>
          <div className="mx-auto flex w-52 gap-2">
            <Suspense
              fallback={<Skeleton className="mx-auto h-9 w-full max-w-sm" />}
            >
              <DynamicSearch params={showcaseParams} />
            </Suspense>
          </div>
          <div className="ml-auto flex w-full justify-end gap-2">
            <SignedOut>
              <Button variant="outline" className="cursor-pointer" asChild>
                <SignInButton>
                  <span className="flex items-center gap-2">
                    <Notion className="h-5 w-5" /> Sign in with Notion
                  </span>
                </SignInButton>
              </Button>
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

const DynamicSearch = async ({
  params,
}: {
  params: Promise<{ userId: string; databaseId: string }>;
}) => {
  const { userId, databaseId } = await params;

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
    <SearchBar
      userId={userId}
      selectedDatabaseId={databaseId}
      locations={result.locations}
      showcase
    />
  );
};
