import type { inferRouterOutputs } from "@trpc/server";
import { create } from "zustand";

import type { AppRouter } from "@acme/api";

interface FilterState {
  property: string;
  type: "select" | "number";
  values: string[];
  operator?: "gt" | "lt";
  value?: number;
}

type RouterOutput = inferRouterOutputs<AppRouter>;

export type DatabaseProperty =
  RouterOutput["user"]["getDatabaseProperties"][number];

// Helper function to update URL search params
const updateUrl = (filters: FilterState[], direction: "asc" | "desc") => {
  if (typeof window === "undefined") return;

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

  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${params.toString() ? "?" : ""}${params.toString()}`,
  );
};

// Helper function to parse URL search params
const parseUrl = () => {
  if (typeof window === "undefined") {
    return { filters: [], direction: "asc" as const };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: FilterState[] = [];

  // Parse filters
  params.getAll("filter").forEach((param) => {
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
  const direction = params.get("direction") === "desc" ? "desc" : "asc";

  return { filters, direction };
};

interface SidebarState {
  // Filter and sort state
  filters: FilterState[];
  sortDirection: "asc" | "desc";

  // Actions
  updateFilter: (property: string, values: string[]) => void;
  updateNumberFilter: (
    property: string,
    operator: "gt" | "lt",
    value: number,
  ) => void;
  removeFilter: (property: string) => void;
  clearFilters: () => void;
  setSortDirection: (direction: "asc" | "desc") => void;

  // URL sync
  syncWithUrl: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // Core state
  locations: [],

  // Filter and sort state
  filters: [],
  sortDirection: "asc",

  // Actions
  updateFilter: (property, values) =>
    set((state) => {
      const newFilters = [
        ...state.filters.filter((f) => f.property !== property),
        { property, type: "select" as const, values },
      ];
      updateUrl(newFilters, state.sortDirection);
      return { filters: newFilters };
    }),

  updateNumberFilter: (property, operator, value) =>
    set((state) => {
      const newFilters = [
        ...state.filters.filter((f) => f.property !== property),
        { property, type: "number" as const, values: [], operator, value },
      ];
      updateUrl(newFilters, state.sortDirection);
      return { filters: newFilters };
    }),

  removeFilter: (property) =>
    set((state) => {
      const newFilters = state.filters.filter((f) => f.property !== property);
      updateUrl(newFilters, state.sortDirection);
      return { filters: newFilters };
    }),

  clearFilters: () =>
    set((state) => {
      updateUrl([], state.sortDirection);
      return { filters: [] };
    }),

  setSortDirection: (direction) =>
    set((state) => {
      updateUrl(state.filters, direction);
      return { sortDirection: direction };
    }),

  // URL sync
  syncWithUrl: () => {
    const { filters, direction } = parseUrl();
    set({
      filters,
      sortDirection: direction as "asc" | "desc" | undefined,
    });
  },
}));
