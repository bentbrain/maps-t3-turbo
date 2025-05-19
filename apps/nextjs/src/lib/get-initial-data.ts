"server only";

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Client } from "@notionhq/client";

import { env } from "@acme/env/env";

export interface SelectValue {
  id: string;
  name: string;
  color: string;
}

interface FilterOption {
  name: string;
  values: SelectValue[];
}

export interface Location {
  id: string;
  name: string;
  address: string;
  website: string | null;
  lng: number;
  lat: number;
  notionUrl: string;
  icon: string | null;
  filterOptions: FilterOption[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const getNotionUrl = (id: string) => {
  return `https://notion.so/${id.replace(/-/g, "")}`;
};

function calculateBounds(locations: Location[]): MapBounds {
  const bounds = locations.reduce(
    (acc, loc) => {
      return {
        north: Math.max(acc.north, loc.lat),
        south: Math.min(acc.south, loc.lat),
        east: Math.max(acc.east, loc.lng),
        west: Math.min(acc.west, loc.lng),
      };
    },
    {
      north: -90,
      south: 90,
      east: -180,
      west: 180,
    },
  );

  // Add padding to bounds (10% of the total span)
  const latPadding = (bounds.north - bounds.south) * 0.1;
  const lngPadding = (bounds.east - bounds.west) * 0.1;

  return {
    north: bounds.north + latPadding,
    south: bounds.south - latPadding,
    east: bounds.east + lngPadding,
    west: bounds.west - lngPadding,
  };
}

type InitialDataResult =
  | {
      success: true;
      locations: Location[];
      initialBounds: MapBounds;
      initialCenter: { lat: number; lng: number };
    }
  | { success: false; error: string };

export const getInitialData = async ({
  databaseId,
}: {
  databaseId: string;
}): Promise<InitialDataResult> => {
  try {
    const token = env.NEXT_PUBLIC_NOTION_TOKEN;
    if (!token) {
      return { success: false, error: "Notion token is not configured" };
    }

    const notion = new Client({
      auth: token,
    });

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    // Check if database has any results and first result is a page
    if (
      response.results.length === 0 ||
      !response.results[0] ||
      !("properties" in response.results[0])
    ) {
      return {
        success: false,
        error: "No valid pages found in the database",
      };
    }

    // Check if database has the correct properties, return error if not
    const requiredProperties = ["Address", "Name", "Latitude", "Longitude"];
    const firstPage = response.results[0] as PageObjectResponse;
    const missingProperties = requiredProperties.filter(
      (property) => !(property in firstPage.properties),
    );
    if (missingProperties.length > 0) {
      return {
        success: false,
        error: `Missing required properties: ${missingProperties.join(", ")}`,
      };
    }

    const properties = response.results.map((result) => {
      if (!("properties" in result) || result.object !== "page") return null;
      const page = result;
      return {
        id: page.id,
        properties: page.properties,
        icon: page.icon?.type === "emoji" ? page.icon.emoji : null,
      };
    });

    const locations = (
      await Promise.all(
        properties
          .filter(
            (p): p is NonNullable<(typeof properties)[number]> => p !== null,
          )
          .map((property) => {
            const props = property.properties;

            if (!props.Address || props.Address.type !== "rich_text")
              return null;

            const richText = props.Address.rich_text as {
              plain_text: string;
            }[];
            const addressString = richText[0]?.plain_text;
            if (!addressString) return null;

            // Check for existing coordinates
            let latitude: number | null = null;
            let longitude: number | null = null;

            if (
              props.Latitude?.type === "number" &&
              props.Longitude?.type === "number" &&
              props.Latitude.number !== null &&
              props.Longitude.number !== null
            ) {
              latitude = props.Latitude.number;
              longitude = props.Longitude.number;
            } else {
              return null;
            }

            // Extract all select and multi-select properties
            const location: Location = {
              id: property.id,
              address: addressString,
              name:
                props.Name?.type === "title"
                  ? ((props.Name.title as { plain_text: string }[])[0]
                      ?.plain_text ?? "Unnamed Location")
                  : "Unnamed Location",
              website: props.Website?.type === "url" ? props.Website.url : null,
              lng: longitude,
              lat: latitude,
              notionUrl: getNotionUrl(property.id),
              icon: typeof property.icon === "string" ? property.icon : null,
              filterOptions: [],
            };

            // Dynamically add all select and multi-select properties
            for (const [key, value] of Object.entries(props)) {
              if (value.type === "multi_select") {
                location.filterOptions.push({
                  name: key,
                  values: value.multi_select.map((item) => ({
                    name: item.name,
                    color: item.color,
                    id: item.id,
                  })),
                });
              } else if (value.type === "select" && value.select) {
                location.filterOptions.push({
                  name: key,
                  values: [
                    {
                      name: value.select.name,
                      color: value.select.color,
                      id: value.select.id,
                    },
                  ],
                });
              }
            }

            return location;
          }),
      )
    ).filter((item): item is Location => item !== null);

    if (locations.length === 0) {
      return {
        success: false,
        error: "No valid locations found in the database",
      };
    }

    const initialBounds = calculateBounds(locations);
    const initialCenter = {
      lat: (initialBounds.north + initialBounds.south) / 2,
      lng: (initialBounds.east + initialBounds.west) / 2,
    };

    return {
      success: true,
      locations,
      initialBounds,
      initialCenter,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: `Failed to fetch database: ${error.message}`,
      };
    }
    return { success: false, error: "Failed to fetch database" };
  }
};
