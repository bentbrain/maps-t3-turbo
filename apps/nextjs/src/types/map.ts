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

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icon: string | null;
  notionUrl: string;
  website: string | null;
  address: string;
  filterOptions: FilterOption[];
}

export interface MarkerPosition {
  lat: number;
  lng: number;
}
