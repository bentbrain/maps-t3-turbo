import { Suspense } from "react";
import { caller } from "@/trpc/server";
import { SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { Calendar, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";

import type { RouterOutputs } from "@acme/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { DownloadButton } from "./_components/download-button";
import { ReleasesClient } from "./_components/releases-client";

type Release = RouterOutputs["releases"]["getAllReleases"][0];

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

async function ReleasesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page ?? "1", 10);
  const perPage = 10;

  // Fetch data on the server
  const fetchReleasesData = async () => {
    try {
      const releases = await caller.releases.getAllReleases({
        page: currentPage,
        perPage,
      });
      return { releases };
    } catch (error) {
      console.error("Error fetching releases:", error);
      return { releases: [] };
    }
  };

  const { releases } = await fetchReleasesData();

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground text-lg">
            Stay up to date with the latest features and improvements
          </p>
        </div>
        <div className="space-y-6">
          {releases.length > 0 ? (
            <>
              <div className="space-y-4">
                {releases
                  .filter((release) => !release.draft && !release.prerelease)
                  .map((release) => (
                    <ReleaseCard key={release.id} release={release} />
                  ))}
              </div>
              <ReleasesClient
                currentPage={currentPage}
                hasMoreReleases={releases.length === perPage}
              />
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground text-center">
                  <p>No releases found.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

async function ReleaseCard({ release }: { release: Release }) {
  const user = await currentUser();
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            <Tag className="mr-1 h-3 w-3" />
            {release.tagName}
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 font-mono"
          >
            <Calendar className="h-4 w-4" />
            {release.publishedAt
              ? format(new Date(release.publishedAt), "PPP")
              : "Date unavailable"}
          </Badge>
        </div>
      </CardHeader>
      {release.body && (
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                // Remove links and render as plain text
                a: ({ children }) => <span>{children}</span>,
              }}
            >
              {release.body}
            </ReactMarkdown>
          </div>
          {release.assets.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold">Downloads</h4>
              <div className="flex flex-wrap gap-2">
                {release.assets.map((asset) => {
                  if (!user) {
                    return (
                      <Button asChild className="cursor-pointer" key={asset.id}>
                        <SignInButton>Sign in to download</SignInButton>
                      </Button>
                    );
                  }

                  return (
                    <DownloadButton
                      key={asset.id}
                      assetId={asset.id}
                      assetName={asset.name}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Loading component for Suspense
export function ReleasesLoading() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-64" />
          <Skeleton className="mx-auto h-6 w-96" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

// Wrap the main component with Suspense
export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<ReleasesLoading />}>
      <ReleasesPage {...props} />
    </Suspense>
  );
}
