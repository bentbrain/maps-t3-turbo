"use client";

import type { DatabaseProperty } from "@/lib/sidebar-store";
import type { Location } from "@/lib/types";
import type { Marker } from "@googlemaps/markerclusterer";

// Map styles to hide road labels
export const MAP_STYLES = [
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.local",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

// Store marker icons for clustering
export const markerIconEmojiMap = new WeakMap<Marker, string>();

// Group and offset overlapping locations
export const getOffsetLocations = (locations: Location[]): Location[] => {
  // Group locations by coordinates
  const groups = locations.reduce(
    (acc, l) => {
      const key = `${l.lat},${l.lng}`;
      acc[key] ??= [];
      acc[key].push(l);
      return acc;
    },
    {} as Record<string, Location[]>,
  );

  // Add slight offset to overlapping markers
  const offset = 0.0002; // About 20 meters
  return locations.map((loc) => {
    const key = `${loc.lat},${loc.lng}`;
    const group = groups[key];
    if (group?.length === 1) return loc;

    const index = group?.findIndex((l) => l.id === loc.id);
    return {
      ...loc,
      lat: loc.lat + (index ?? 0) * offset,
      lng: loc.lng + (index ?? 0) * offset,
    };
  });
};

// Simple hash function for deterministic values between 0 and 1
export const hash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs((hash % 1000) / 1000); // Convert to 0-1 range
};

interface FilterState {
  property: string;
  type: "select" | "number";
  values: string[];
  operator?: "gt" | "lt";
  value?: number;
}

// Filter locations based on filter criteria
export function filterLocations(
  locations: Location[],
  filters: FilterState[],
): Location[] {
  if (filters.length === 0) return locations;

  return locations.filter((location) =>
    filters.every((filter) => {
      if (filter.type === "select") {
        const option = location.filterOptions.find(
          (opt) => opt.name === filter.property,
        );
        return option?.values?.some((value) =>
          filter.values.includes(value.name),
        );
      } else {
        // Number filter
        const baseProperty = filter.property.split("_")[0]; // Extract base property name without timestamp
        const numberValue = location.filterOptions.find(
          (opt) => opt.name === baseProperty,
        )?.value;
        if (typeof numberValue !== "number") return false;

        if (filter.operator === "gt") {
          return numberValue > (filter.value ?? 0);
        } else if (filter.operator === "lt") {
          return numberValue < (filter.value ?? 0);
        }
        return false;
      }
    }),
  );
}

// Sort locations based on a property
export function sortLocations(
  locations: Location[],
  groupProperty: string | null,
  groupDirection: "asc" | "desc",
  databaseProperties: Record<string, DatabaseProperty>,
): Location[] {
  if (!groupProperty) return locations;

  const groupPropertyDef = databaseProperties[groupProperty];
  if (!groupPropertyDef) return locations;

  return [...locations].sort((a, b) => {
    const aOption = a.filterOptions.find((opt) => opt.name === groupProperty);
    const bOption = b.filterOptions.find((opt) => opt.name === groupProperty);

    // For non-multi-select fields, just compare the first value
    const aCompare = aOption?.values?.[0]?.name ?? "";
    const bCompare = bOption?.values?.[0]?.name ?? "";

    // If we have a database property definition, use its order
    let aIndex = -1;
    let bIndex = -1;

    if (groupPropertyDef.type === "select") {
      aIndex = groupPropertyDef.select.options.findIndex(
        (opt) => opt.name === aCompare,
      );
      bIndex = groupPropertyDef.select.options.findIndex(
        (opt) => opt.name === bCompare,
      );
    } else if (groupPropertyDef.type === "multi_select") {
      aIndex = groupPropertyDef.multi_select.options.findIndex(
        (opt) => opt.name === aCompare,
      );
      bIndex = groupPropertyDef.multi_select.options.findIndex(
        (opt) => opt.name === bCompare,
      );
    }

    // If both values are found in the options, sort by their order
    if (aIndex !== -1 && bIndex !== -1) {
      return groupDirection === "asc" ? aIndex - bIndex : bIndex - aIndex;
    }

    // Fall back to alphabetical sorting if no property definition or values not found
    return groupDirection === "asc"
      ? aCompare.localeCompare(bCompare)
      : bCompare.localeCompare(aCompare);
  });
}

// Combined function for backward compatibility
export function filterAndGroupLocations(
  locations: Location[],
  filters: FilterState[],
  groupProperty: string | null,
  groupDirection: "asc" | "desc",
  databaseProperties: Record<string, DatabaseProperty>,
): Location[] {
  const filteredLocations = filterLocations(locations, filters);
  return sortLocations(
    filteredLocations,
    groupProperty,
    groupDirection,
    databaseProperties,
  );
}
