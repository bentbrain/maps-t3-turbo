import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache as cache } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import GoogleMapView from "@/components/google-map-view";
import RetryButton from "@/components/retry-button";
import {
  ErrorMessage,
  getInitialData,
  getNotionUrl,
} from "@/lib/get-initial-data";
import { caller, prefetch, trpc } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

interface Props {
  params: Promise<{ databaseId: string; userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { databaseId } = await params;

  const databases = await caller.user.getUserDatabasesFromNotion();

  const database = databases.find((db) => db.id === databaseId);

  return {
    title: `Map: ${database?.title[0]?.plain_text}`,
  };
}

export default function Page({
  params,
}: {
  params: Promise<{ databaseId: string; userId: string }>;
}) {
  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="grid h-full w-full place-items-center">
            <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
          </div>
        }
      >
        <DynamicParts params={params} />
      </Suspense>
    </div>
  );
}

async function DynamicParts({
  params,
}: {
  params: Promise<{ databaseId: string; userId: string }>;
}) {
  const { databaseId, userId } = await params;

  const { userId: clerkUserId } = await auth();

  if (!z.string().uuid().safeParse(databaseId).success) {
    return notFound();
  }

  if (!userId || clerkUserId !== userId) {
    redirect("/");
  }

  prefetch(
    trpc.user.getDatabaseProperties.queryOptions({
      databaseId,
      userId,
    }),
  );
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
    if (result.error === ErrorMessage.NO_VALID_PAGES_FOUND) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <p>No valid pages found in the database</p>
        </div>
      );
    }

    return <ErrorPage databaseId={databaseId} />;
  }

  return (
    <GoogleMapView
      locations={result.locations}
      initialBounds={result.initialBounds}
      initialCenter={result.initialCenter}
      sharePage={false}
    />
  );
}

const ErrorPage = ({ databaseId }: { databaseId: string }) => {
  return (
    <div className="bg-muted flex w-full items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" /> Failed to Load
            Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Please make sure:</p>
          <ul className="list-inside list-disc">
            <li>The database ID is correct</li>
            <li>The database exists and is accessible</li>
            <li>
              The database has the required properties (Address, Name, etc.)
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          <RetryButton />
          <Button className="w-full sm:w-auto" asChild variant="outline">
            <Link href={getNotionUrl(databaseId)} target="_blank">
              View Database in Notion
            </Link>
          </Button>
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/">Try Another Database</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
