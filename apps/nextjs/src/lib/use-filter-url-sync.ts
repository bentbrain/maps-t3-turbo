"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useMapStore } from "./map-store";

interface FilterState {
  property: string;
  type: "select" | "number";
  values: string[];
  operator?: "gt" | "lt";
  value?: number;
}

// Helper function to parse URL search params
function parseFiltersFromSearchParams(searchParams: URLSearchParams): {
  filters: FilterState[];
  direction: "asc" | "desc";
} {
  const filters: FilterState[] = [];

  // Parse filters
  searchParams.getAll("filter").forEach((param) => {
    const parts = param.split(":");
    if (parts.length === 2) {
      // Select filter
      const [property, valuesStr] = parts;
      if (property && valuesStr) {
        filters.push({
          property,
          type: "select" as const,
          values: valuesStr.split(","),
        });
      }
    } else if (parts.length === 3) {
      // Number filter
      const [property, operator, valueStr] = parts;
      if (property && (operator === "gt" || operator === "lt") && valueStr) {
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          filters.push({
            property,
            type: "number" as const,
            values: [],
            operator,
            value,
          });
        }
      }
    }
  });

  // Parse direction
  const direction = searchParams.get("direction") === "desc" ? "desc" : "asc";

  return { filters, direction };
}

// Helper function to create search params from filters
function createSearchParamsFromFilters(
  filters: FilterState[],
  direction: "asc" | "desc",
): URLSearchParams {
  const params = new URLSearchParams();

  // Add filters
  filters.forEach((filter) => {
    if (filter.type === "select") {
      params.append("filter", `${filter.property}:${filter.values.join(",")}`);
    } else {
      params.append(
        "filter",
        `${filter.property}:${filter.operator}:${filter.value}`,
      );
    }
  });

  // Add direction
  params.set("direction", direction);

  return params;
}

export function useFilterUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { filters, sortDirection, initializeFromUrl } = useMapStore();

  // Initialize store from URL on mount
  useEffect(() => {
    const { filters: urlFilters, direction } =
      parseFiltersFromSearchParams(searchParams);
    initializeFromUrl(urlFilters, direction);
  }, []); // Only run once on mount

  // Update URL when filters change
  const updateUrl = useCallback(() => {
    const params = createSearchParamsFromFilters(filters, sortDirection);
    const newUrl = `${pathname}?${params.toString()}`;

    // Only update if URL is actually different to prevent loops
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, sortDirection, pathname, router]);

  // Sync URL when filters or sort direction changes
  useEffect(() => {
    // Add a small delay to batch rapid changes
    const timeoutId = setTimeout(updateUrl, 100);
    return () => clearTimeout(timeoutId);
  }, [updateUrl]);

  return {
    // Utility functions that can be used by components
    parseFiltersFromUrl: () => parseFiltersFromSearchParams(searchParams),
    createUrlFromFilters: (
      filters: FilterState[],
      direction: "asc" | "desc",
    ) => {
      const params = createSearchParamsFromFilters(filters, direction);
      return `${pathname}?${params.toString()}`;
    },
  };
}
