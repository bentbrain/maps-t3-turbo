import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { TRPCRouterRecord } from "@trpc/server";
import type { RecordMap } from "notion-types";
import { unstable_cache as cache, revalidateTag } from "next/cache";
import { Client } from "@notionhq/client";
import { TRPCError } from "@trpc/server";
import { NotionCompatAPI } from "notion-compat";
import { z } from "zod";

import { env } from "@acme/env/env";

import { publicProcedure } from "../trpc";

const notionClient = new Client({ auth: env.NEXT_PUBLIC_NOTION_TOKEN });

const notion = new NotionCompatAPI(notionClient);

// function to filter out images from a recordMap
const filterOutImages = (recordMap: RecordMap) => {
  const { block } = recordMap;
  const filteredBlocks = Object.fromEntries(
    Object.entries(block).filter(
      ([, blockData]: [string, unknown]) =>
        (blockData as { value?: { type?: string } }).value?.type !== "image",
    ),
  );
  return {
    ...recordMap,
    block: filteredBlocks,
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {},
  };
};

// Type guard for relation property
function isRelationProperty(
  value: PageObjectResponse["properties"][string] & { TitleToUse: string },
): value is Extract<
  PageObjectResponse["properties"][string],
  { type: "relation" }
> & { TitleToUse: string } {
  return value.type === "relation" && Array.isArray(value.relation);
}

// Helper type for relation property
interface RelationValue {
  relation: { id: string }[];
}

async function getPage(pageId: string) {
  try {
    const [recordMap, pageProperties] = await Promise.all([
      notion.getPage(pageId),
      notionClient.pages.retrieve({
        page_id: pageId,
      }) as Promise<PageObjectResponse>,
    ]);

    const filteredRecordMap = filterOutImages(recordMap);

    const properties = pageProperties.properties;

    // Extract the title and icon from the page
    const titleProp = Object.values(properties).find(
      (
        property,
      ): property is Extract<
        PageObjectResponse["properties"][string],
        { type: "title" }
      > => property.type === "title",
    );
    const title = titleProp?.title[0]?.plain_text;

    // Transform properties to include TitleToUse
    const propertiesWithTitles = Object.entries(properties).reduce(
      (acc, [key, value]) => {
        acc[key] = {
          ...value,
          TitleToUse: key,
        };
        return acc;
      },
      {} as Record<
        string,
        PageObjectResponse["properties"][string] & { TitleToUse: string }
      >,
    );

    const propertiesWithoutTitle = Object.entries(propertiesWithTitles)
      .filter(([, value]) => value.type !== "title")
      .reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<
          string,
          PageObjectResponse["properties"][string] & { TitleToUse: string }
        >,
      );

    const icon =
      pageProperties.icon?.type === "emoji" ? pageProperties.icon.emoji : null;

    // map relations and get the page titles
    const relations = Object.entries(propertiesWithoutTitle).filter(
      ([, value]) => value.type === "relation",
    );

    const relationTitles = await Promise.all(
      relations.map(async ([, value]) => {
        const rel = (value as RelationValue).relation;
        if (rel.length > 0 && rel[0]?.id) {
          const page = (await notionClient.pages.retrieve({
            page_id: rel[0].id,
          })) as PageObjectResponse;
          return {
            id: rel[0].id,
            title:
              Object.values(page.properties).find(
                (prop) => prop.type === "title",
              )?.title[0]?.plain_text ?? "Untitled",
          };
        }
        return null;
      }),
    );

    // Create a map of relation IDs to titles
    const relationTitleMap = relationTitles.reduce(
      (acc, relation) => {
        if (relation) {
          acc[relation.id] = relation.title;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    // Merge titles into properties
    const propertiesWithRelationTitles = Object.entries(
      propertiesWithoutTitle,
    ).reduce(
      (acc, [key, value]) => {
        if (isRelationProperty(value) && value.relation[0]?.id) {
          acc[key] = {
            ...value,
            relationTitle: relationTitleMap[value.relation[0].id],
          };
        } else {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<
        string,
        PageObjectResponse["properties"][string] & {
          TitleToUse: string;
          relationTitle?: string;
        }
      >,
    );

    return {
      error: null,
      data: {
        recordMap: filteredRecordMap,
        title,
        icon,
        properties: propertiesWithRelationTitles,
        id: pageProperties.id,
      },
    };
  } catch (error) {
    // You can customize the error message or structure as needed
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}

export const pageRouter = {
  getPage: publicProcedure
    .input(z.object({ markerId: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.markerId) {
        console.log("No markerId provided, returning null");
        return null;
      }

      const cachedPage = cache(
        async () => {
          const { data, error } = await getPage(input.markerId ?? "");
          return { data, error };
        },
        [input.markerId],
        {
          tags: [input.markerId],
        },
      );

      const { data, error } = await cachedPage();

      if (!data || error) {
        revalidateTag(input.markerId);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Page not found",
          cause: error,
        });
      }

      return {
        recordMap: data.recordMap,
        title: data.title,
        icon: data.icon,
        properties: data.properties,
        id: data.id,
      };
    }),

  getPages: publicProcedure
    .input(z.object({ markerIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      const recordMaps = await Promise.all(
        input.markerIds.map(async (id) => {
          try {
            const recordMap = await notion.getPage(id);
            return [id, recordMap];
          } catch (error) {
            console.error(`Failed to fetch page ${id}:`, error);
            return [id, null];
          }
        }),
      );

      return Object.fromEntries(recordMaps) as Record<string, RecordMap | null>;
    }),
} satisfies TRPCRouterRecord;
