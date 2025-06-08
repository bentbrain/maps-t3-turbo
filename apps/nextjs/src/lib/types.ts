export interface SelectValue {
  id: string;
  name: string;
  color: string;
}

export interface FilterOption {
  name: string;
  values?: SelectValue[];
  value?: number;
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
  properties: Record<string, { type: string; number?: number }>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export enum ErrorMessage {
  NO_VALID_PAGES_FOUND = "No valid pages found in the database",
  MISSING_REQUIRED_PROPERTIES = "Missing required properties",
  FAILED_TO_FETCH_DATABASE = "Failed to fetch database",
  NOTION_TOKEN_NOT_CONFIGURED = "Notion token is not configured",
}

export const getNotionUrl = (id: string) => {
  return `https://notion.so/${id.replace(/-/g, "")}`;
};
