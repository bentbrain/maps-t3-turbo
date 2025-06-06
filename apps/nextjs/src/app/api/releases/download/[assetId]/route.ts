import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";

import { env } from "@acme/env/env";

const REPO_OWNER = "bentbrain";
const REPO_NAME = "maps-t3-turbo";

export async function GET({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await params;
    const assetIdNum = parseInt(assetId, 10);

    if (isNaN(assetIdNum)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
    }

    // Initialize GitHub client with PAT
    const github = new Octokit({
      auth: env.GITHUB_PAT,
    });

    // Get the asset details first
    const { data: asset } = await github.rest.repos.getReleaseAsset({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      asset_id: assetIdNum,
    });

    // For private repositories, we need to make an authenticated request to the download URL
    const downloadResponse = await fetch(asset.url, {
      headers: {
        Authorization: `token ${env.GITHUB_PAT}`,
        Accept: "application/octet-stream",
        "User-Agent": "notion-locations-app",
      },
    });

    if (!downloadResponse.ok) {
      console.error(
        "Failed to fetch asset from GitHub:",
        downloadResponse.status,
      );
      return NextResponse.json(
        { error: "Failed to download asset" },
        { status: 404 },
      );
    }

    // Get the file content
    const fileBuffer = await downloadResponse.arrayBuffer();

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": asset.content_type || "application/octet-stream",
        "Content-Length": asset.size.toString(),
        "Content-Disposition": `attachment; filename="${asset.name}"`,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error downloading asset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
