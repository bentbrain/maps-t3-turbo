import type { TRPCRouterRecord } from "@trpc/server";
import { Octokit } from "@octokit/rest";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@acme/env/env";

import { publicProcedure } from "../trpc";

// Initialize GitHub client with PAT authentication
function getGitHubClient() {
  return new Octokit({
    auth: env.GITHUB_PAT,
  });
}

const REPO_OWNER = "bentbrain";
const REPO_NAME = "maps-t3-turbo";

export const releasesRouter = {
  getLatestRelease: publicProcedure.query(async () => {
    try {
      const github = getGitHubClient();

      const { data: release } = await github.rest.repos.getLatestRelease({
        owner: REPO_OWNER,
        repo: REPO_NAME,
      });

      return {
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        htmlUrl: release.html_url,
        publishedAt: release.published_at,
        draft: release.draft,
        prerelease: release.prerelease,
        asset: release.assets
          .map((asset) => ({
            id: asset.id,
            name: asset.name,
            size: asset.size,
            url: asset.browser_download_url,
            contentType: asset.content_type,
          }))
          .find((asset) => asset.name.includes("extension")),
      };
    } catch (error) {
      console.error("Error fetching latest release:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch latest release from GitHub",
      });
    }
  }),

  getAllReleases: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(30),
      }),
    )
    .query(async ({ input }) => {
      const { page, perPage } = input;

      try {
        const github = getGitHubClient();

        const { data: releases } = await github.rest.repos.listReleases({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          page,
          per_page: perPage,
        });

        return releases.map((release) => ({
          id: release.id,
          tagName: release.tag_name,
          name: release.name,
          body: release.body,
          htmlUrl: release.html_url,
          publishedAt: release.published_at,
          draft: release.draft,
          prerelease: release.prerelease,
          extensionAsset: release.assets
            .map((asset) => ({
              id: asset.id,
              name: asset.name,
              url: asset.browser_download_url,
              size: asset.size,
              contentType: asset.content_type,
            }))
            .find((asset) => asset.name.includes("extension")),
        }));
      } catch (error) {
        console.error("Error fetching releases:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch releases from GitHub",
        });
      }
    }),

  generateDownloadUrl: publicProcedure
    .input(
      z.object({
        assetId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { assetId } = input;

      try {
        const github = getGitHubClient();

        // Get the asset details
        const { data: asset } = await github.rest.repos.getReleaseAsset({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          asset_id: assetId,
        });

        // Return the authenticated download URL that our API route can handle
        return {
          downloadUrl: `/api/releases/download/${assetId}`,
          fileName: asset.name,
        };
      } catch (error) {
        console.error("Error generating download URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate download URL",
        });
      }
    }),
} satisfies TRPCRouterRecord;
