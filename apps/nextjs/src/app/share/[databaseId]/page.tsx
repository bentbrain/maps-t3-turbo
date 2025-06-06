import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleMapView from "@/components/google-map-view";
import RetryButton from "@/components/retry-button";
import { getInitialData, getNotionUrl } from "@/lib/get-initial-data";
import { AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";

import { env } from "@acme/env/env";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function Page({
  params,
}: {
  params: Promise<{ databaseId: string }>;
}) {
  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="grid h-dvh w-full place-items-center">
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
  params: Promise<{ databaseId: string }>;
}) {
  const { databaseId } = await params;

  if (!z.string().uuid().safeParse(databaseId).success) {
    redirect(`/?databaseId=${databaseId}`);
  }

  const result = await getInitialData({ databaseId });

  if (!result.success) {
    await fetch(
      `${env.NEXT_PUBLIC_SITE_URL}/api/revalidate-route/${databaseId}`,
    );
    return <ErrorPage databaseId={databaseId} />;
  }

  return (
    <main className="h-dvh w-full">
      <GoogleMapView
        locations={result.locations}
        initialBounds={result.initialBounds}
        initialCenter={result.initialCenter}
        sharePage={true}
      />
    </main>
  );
}

const ErrorPage = ({ databaseId }: { databaseId: string }) => {
  return (
    <div className="bg-muted flex h-dvh w-full items-center justify-center">
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
