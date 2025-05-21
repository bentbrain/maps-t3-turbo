import type {
  CreatePageParameters,
  DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { TRPCRouterRecord } from "@trpc/server";
import { unstable_cache as cache, revalidateTag } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { Client } from "@notionhq/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createDynamicFormSchema } from "@acme/validators/new-place-schema";

import type { EmojiRequest } from "../types";
import { protectedProcedure, publicProcedure } from "../trpc";

async function getAuthenticatedNotionClient(userId: string) {
  const provider = "notion";
  const clerk = await clerkClient();
  const clerkResponse = await clerk.users.getUserOauthAccessToken(
    userId,
    provider,
  );
  const accessToken = clerkResponse.data[0]?.token ?? "";

  if (!accessToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Notion access token not found. Please reconnect Notion.",
    });
  }
  return new Client({ auth: accessToken });
}

async function fetchAndFormatDatabaseProperties(
  notion: Client,
  databaseId: string,
): Promise<
  Record<string, { type: "multi_select" | "select" | "relation" | "number" }>
> {
  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    return Object.entries(database.properties).reduce(
      (acc, [key, prop]: [string, { type: string }]) => {
        if (
          prop.type === "multi_select" ||
          prop.type === "select" ||
          prop.type === "relation" ||
          prop.type === "number"
        ) {
          acc[key] = { type: prop.type };
        }
        return acc;
      },
      {} as Record<
        string,
        { type: "multi_select" | "select" | "relation" | "number" }
      >,
    );
  } catch (error) {
    console.error("Failed to fetch or format database properties:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch database properties from Notion.",
    });
  }
}

async function getDatabasesFromNotion(notionClient: Client) {
  // Search for all databases
  const response = await notionClient.search({
    filter: {
      property: "object",
      value: "database",
    },
    page_size: 100,
  });

  // Filter databases that have both 'Longitude' and 'Latitude' properties
  const filteredDatabases = response.results.filter(
    (db): db is DatabaseObjectResponse =>
      db.object === "database" &&
      "Longitude" in db.properties &&
      "Latitude" in db.properties,
  );

  return filteredDatabases;
}

export const userRouter = {
  getUserDatabasesFromNotion: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const notionClient = await getAuthenticatedNotionClient(userId);

    const filteredDatabases = cache(
      async () => {
        return await getDatabasesFromNotion(notionClient);
      },
      [userId],
      {
        tags: [userId],
        revalidate: 10 * 60, // 10 minutes
      },
    );

    const databases = await filteredDatabases();

    return databases;
  }),

  addPlaceToNotion: protectedProcedure
    .input(
      z.object({
        databaseId: z.string().uuid(),
        formData: z.unknown(), // Will be validated dynamically
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { databaseId, formData } = input;

      const notion = await getAuthenticatedNotionClient(userId);

      const properties = await fetchAndFormatDatabaseProperties(
        notion,
        databaseId,
      );

      // Validate form data with dynamic schema
      const schema = createDynamicFormSchema(properties);
      const parsedForm = schema.safeParse(formData);

      if (!parsedForm.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid form data",
        });
      }

      // Build Notion properties
      function buildNotionProperties(
        props: typeof properties,
        data: Record<string, unknown>,
      ): CreatePageParameters["properties"] {
        const notionProps: CreatePageParameters["properties"] = {};

        for (const [key, prop] of Object.entries(props)) {
          const value = data[key.toLowerCase()];
          if (prop.type === "multi_select") {
            notionProps[key] = {
              type: "multi_select",
              multi_select: Array.isArray(value)
                ? value.map((name: unknown) => ({ name: String(name) }))
                : [],
            };
          } else if (prop.type === "select") {
            notionProps[key] = {
              type: "select",
              select:
                typeof value === "string" && value.length > 0
                  ? { name: value }
                  : null,
            };
          } else if (prop.type === "relation") {
            notionProps[key] = {
              type: "relation",
              relation:
                typeof value === "string" && value.length > 0
                  ? [{ id: value }]
                  : [],
            };
          } else {
            notionProps[key] = {
              type: "number",
              number: typeof value === "number" ? value : 0,
            };
          }
        }

        // Add required static properties
        notionProps.Name = {
          title: [
            {
              text: {
                content: typeof data.title === "string" ? data.title : "",
              },
            },
          ],
        };
        notionProps.Address = {
          rich_text: [
            {
              text: {
                content: typeof data.address === "string" ? data.address : "",
              },
            },
          ],
        };
        notionProps.Longitude = {
          number:
            typeof data.longitude === "string"
              ? parseFloat(data.longitude) || 0
              : typeof data.longitude === "number"
                ? data.longitude
                : 0,
        };
        notionProps.Latitude = {
          number:
            typeof data.latitude === "string"
              ? parseFloat(data.latitude) || 0
              : typeof data.latitude === "number"
                ? data.latitude
                : 0,
        };
        notionProps.Website = {
          url:
            typeof data.website === "string" && data.website.length > 0
              ? data.website
              : null,
        };

        return notionProps;
      }

      try {
        const notionProperties = buildNotionProperties(
          properties,
          parsedForm.data,
        );
        const response = await notion.pages.create({
          parent: { database_id: databaseId },
          icon: {
            type: "emoji",
            emoji: parsedForm.data.emoji as EmojiRequest,
          },
          properties: notionProperties,
        });

        const pageUrl =
          "url" in response && typeof response.url === "string"
            ? response.url
            : `https://notion.so/${response.id.replace(/-/g, "")}`;

        revalidateTag(databaseId);

        return { pageUrl };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add place",
        });
      }
    }),
  getDatabaseProperties: publicProcedure
    .input(z.object({ databaseId: z.string(), userId: z.string() }))
    .query(async ({ input }) => {
      const { databaseId, userId } = input;
      const notion = await getAuthenticatedNotionClient(userId);

      const database = await notion.databases.retrieve({
        database_id: databaseId,
      });

      return database.properties;
    }),
} satisfies TRPCRouterRecord;
