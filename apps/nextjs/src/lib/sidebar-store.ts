import type { inferRouterOutputs } from "@trpc/server";
import { create } from "zustand";

import type { AppRouter } from "@acme/api";

interface FilterState {
  property: string;
  values: string[];
}

type RouterOutput = inferRouterOutputs<AppRouter>;

export type DatabaseProperty =
  RouterOutput["user"]["getDatabaseProperties"][number];

// Helper function to update URL search params
const updateUrl = (
  filters: FilterState[],
  groupBy: string | null,
  direction: "asc" | "desc",
) => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();

  // Add filters
  filters.forEach((filter) =>
    params.append("filter", `${filter.property}:${filter.values.join(",")}`),
  );

  // Add grouping
  if (groupBy && groupBy !== "none") {
    params.set("group", groupBy);
    params.set("direction", direction);
  }

  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${params.toString() ? "?" : ""}${params.toString()}`,
  );
};

// Helper function to parse URL search params
const parseUrl = () => {
  if (typeof window === "undefined") {
    return { filters: [], groupBy: null, direction: "asc" as const };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: FilterState[] = [];

  // Parse filters
  params.getAll("filter").forEach((param) => {
    const [property, valuesStr] = param.split(":");
    if (property && valuesStr) {
      filters.push({
        property,
        values: valuesStr.split(","),
      });
    }
  });

  // Parse grouping
  const groupBy = params.get("group");
  const direction = params.get("direction") === "desc" ? "desc" : "asc";

  return { filters, groupBy, direction };
};

interface SidebarState {
  // Filter and sort state
  filters: FilterState[];
  groupBy: string | null;
  sortDirection: "asc" | "desc";

  // Actions
  updateFilter: (property: string, values: string[]) => void;
  removeFilter: (property: string) => void;
  clearFilters: () => void;
  setGroupBy: (property: string | null) => void;
  setSortDirection: (direction: "asc" | "desc") => void;

  // URL sync
  syncWithUrl: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // Core state
  locations: [],

  // Filter and sort state
  filters: [],
  groupBy: null,
  sortDirection: "asc",

  // Actions
  updateFilter: (property, values) =>
    set((state) => {
      const newFilters = [
        ...state.filters.filter((f) => f.property !== property),
        { property, values },
      ];
      updateUrl(newFilters, state.groupBy, state.sortDirection);
      return { filters: newFilters };
    }),

  removeFilter: (property) =>
    set((state) => {
      const newFilters = state.filters.filter((f) => f.property !== property);
      updateUrl(newFilters, state.groupBy, state.sortDirection);
      return { filters: newFilters };
    }),

  clearFilters: () =>
    set((state) => {
      updateUrl([], state.groupBy, state.sortDirection);
      return { filters: [] };
    }),

  setGroupBy: (property) =>
    set((state) => {
      updateUrl(state.filters, property, state.sortDirection);
      return { groupBy: property };
    }),

  setSortDirection: (direction) =>
    set((state) => {
      updateUrl(state.filters, state.groupBy, direction);
      return { sortDirection: direction };
    }),

  // URL sync
  syncWithUrl: () => {
    const { filters, groupBy, direction } = parseUrl();
    set({
      filters,
      groupBy,
      sortDirection: direction as "asc" | "desc" | undefined,
    });
  },
}));
