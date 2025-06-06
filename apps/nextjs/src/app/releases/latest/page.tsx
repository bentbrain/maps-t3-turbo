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

import { DownloadButton } from "../_components/download-button";

type Release = RouterOutputs["releases"]["getLatestRelease"];

async function LatestReleasePage() {
  // Fetch the latest release data on the server
  const fetchLatestRelease = async () => {
    try {
      const release = await caller.releases.getLatestRelease();
      return { release };
    } catch (error) {
      console.error("Error fetching latest release:", error);
      return { release: null };
    }
  };

  const { release } = await fetchLatestRelease();

  return release ? (
    <ReleaseCard release={release} />
  ) : (
    <Card>
      <CardContent className="pt-6">
        <div className="text-muted-foreground text-center">
          <p>No release found.</p>
        </div>
      </CardContent>
    </Card>
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
        {release.name && (
          <h2 className="text-2xl font-semibold">{release.name}</h2>
        )}
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
export function LatestReleaseLoading() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
          <div className="mt-6 space-y-2">
            <Skeleton className="h-6 w-24" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap the main component with Suspense
export default function Page() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Latest Release</h1>
          <p className="text-muted-foreground text-lg">
            The most recent version with all the latest features and
            improvements
          </p>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<LatestReleaseLoading />}>
            <LatestReleasePage />
          </Suspense>
        </div>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              Chrome Extension Installation
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">1. Sign In & Download</h3>
                <p className="text-muted-foreground text-sm">
                  Sign in to your account and download the extension file (.zip
                  or .crx) from the downloads section below.
                </p>
              </div>
              <div>
                <h3 className="font-medium">2. Enable Developer Mode</h3>
                <p className="text-muted-foreground text-sm">
                  Open Chrome and go to{" "}
                  <code className="rounded bg-gray-200 px-1 text-xs dark:bg-gray-700">
                    chrome://extensions/
                  </code>
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Toggle on "Developer mode" in the top-right corner.
                </p>
              </div>
              <div>
                <h3 className="font-medium">3. Install the Extension</h3>
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>
                    <strong>For .zip files:</strong>
                  </p>
                  <ul className="ml-2 list-inside list-disc space-y-1">
                    <li>Extract the downloaded .zip file to a folder</li>
                    <li>
                      Click "Load unpacked" and select the extracted folder
                    </li>
                  </ul>
                  <p className="mt-2">
                    <strong>For .crx files:</strong>
                  </p>
                  <ul className="ml-2 list-inside list-disc space-y-1">
                    <li>
                      Drag and drop the .crx file onto the extensions page
                    </li>
                    <li>Click "Add extension" when prompted</li>
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-medium">4. Verify Installation</h3>
                <p className="text-muted-foreground text-sm">
                  The extension should now appear in your extensions list and
                  toolbar. Check the release notes below for any additional
                  setup steps or permissions required.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Since this extension is not from the
                Chrome Web Store, you may see security warnings. This is normal
                for manually installed extensions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
