import type { notionColourMap } from "@acme/ui";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface FilterOption {
  name: string;
  values: {
    id: string;
    name: string;
    color: keyof typeof notionColourMap;
  }[];
}

export interface MarkerPosition {
  lat: number;
  lng: number;
}
