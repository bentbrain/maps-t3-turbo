import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { env } from "@acme/env/env";

const REPO_OWNER = "bentbrain";
const REPO_NAME = "maps-t3-turbo";

export async function GET(request: NextRequest) {
  try {
    const github = new Octokit({
      auth: env.GITHUB_PAT,
    });

    // Get the latest release
    const { data: release } = await github.rest.repos.getLatestRelease({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    // Find the extension zip file in the release assets
    const extensionAsset = release.assets.find(asset => 
      asset.name.includes("extension") || 
      asset.name.includes("chrome") ||
      asset.content_type === "application/zip"
    );

    if (!extensionAsset) {
      return NextResponse.json(
        { error: "No extension asset found in latest release" },
        { status: 404 }
      );
    }

    // Get the asset download URL with authentication
    const { data: assetData } = await github.rest.repos.getReleaseAsset({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      asset_id: extensionAsset.id,
      headers: {
        accept: "application/octet-stream",
      },
    });

    // Redirect to the download URL
    return NextResponse.redirect(assetData.url);
  } catch (error) {
    console.error("Error downloading latest release:", error);
    
    // Fallback to GitHub releases page
    return NextResponse.redirect(
      `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`
    );
  }
}