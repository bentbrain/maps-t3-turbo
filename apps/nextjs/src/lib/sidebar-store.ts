import type { Location } from "@/lib/get-initial-data";
import { filterAndGroupLocations } from "@/lib/map-utils";
import { create } from "zustand";

interface FilterState {
  property: string;
  values: string[];
}

export interface DatabaseProperty {
  id: string;
  type: "multi_select" | "select" | "number" | "rich_text" | "title" | "url";
  name: string;
  multi_select?: {
    options: {
      id: string;
      name: string;
      color: string;
    }[];
  };
  select?: {
    options: {
      id: string;
      name: string;
      color: string;
    }[];
  };
}

interface SidebarState {
  hydrated: boolean;

  locations: Location[];
  setLocations: (locations: Location[]) => void;

  selectedDatabaseId: string | null;
  setSelectedDatabaseId: (databaseId: string | null) => void;

  // Database properties state
  databaseProperties: Record<string, DatabaseProperty>;
  setDatabaseProperties: (properties: Record<string, DatabaseProperty>) => void;

  // Filter state
  filters: FilterState[];
  addFilter: (property: string, values: string[]) => void;
  removeFilter: (property: string) => void;
  clearFilters: () => void;

  // Group state
  groupProperty: string | null;
  groupDirection: "asc" | "desc";
  setGroupProperty: (property: string | null) => void;
  setGroupDirection: (direction: "asc" | "desc") => void;

  // URL sync
  syncWithUrl: () => void;
  updateUrl: () => void;

  // Helper functions
  getFilteredAndGroupedLocations: (
    locations: Location[],
    filters: FilterState[],
    groupProperty: string | null,
    groupDirection: "asc" | "desc",
    databaseProperties: Record<string, DatabaseProperty>,
  ) => Location[];
}

// Helper function to update URL search params
const updateSearchParams = (
  filters: FilterState[],
  groupProperty: string | null,
  groupDirection: "asc" | "desc",
) => {
  const searchParams = new URLSearchParams(window.location.search);

  // Update filter params
  searchParams.delete("filter");
  filters.forEach((filter) => {
    searchParams.append(
      "filter",
      `${filter.property}:${filter.values.join(",")}`,
    );
  });

  // Update group params
  if (groupProperty) {
    searchParams.set("group", groupProperty);
    searchParams.set("direction", groupDirection);
  } else {
    searchParams.delete("group");
    searchParams.delete("direction");
  }

  // Update URL without reload
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${searchParams.toString() ? "?" : ""}${searchParams.toString()}`,
  );
};

// Helper function to parse URL search params
const parseSearchParams = () => {
  if (typeof window === "undefined")
    return { filters: [], groupProperty: null, groupDirection: "asc" as const };

  const searchParams = new URLSearchParams(window.location.search);
  const filters: FilterState[] = [];
  const filterParams = searchParams.getAll("filter");

  filterParams.forEach((param) => {
    const [property, valuesStr] = param.split(":");
    if (property && valuesStr) {
      filters.push({
        property,
        values: valuesStr.split(","),
      });
    }
  });

  const groupProperty = searchParams.get("group");
  const directionParam = searchParams.get("direction");
  const groupDirection =
    directionParam === "asc" || directionParam === "desc"
      ? directionParam
      : "asc";

  return { filters, groupProperty, groupDirection };
};

export const useSidebarStore = create<SidebarState>((set, get) => ({
  locations: [],
  setLocations: (locations) => set({ locations }),

  selectedDatabaseId: null,
  setSelectedDatabaseId: (databaseId) =>
    set({ selectedDatabaseId: databaseId }),

  // Database properties state
  databaseProperties: {},
  setDatabaseProperties: (properties) =>
    set({ databaseProperties: properties }),

  // Filter state
  hydrated: false,
  filters: [],
  addFilter: (property, values) =>
    set((state) => {
      const newState = {
        filters: [
          ...state.filters.filter((f) => f.property !== property),
          { property, values },
        ],
      };
      updateSearchParams(
        newState.filters,
        state.groupProperty,
        state.groupDirection,
      );
      return newState;
    }),
  removeFilter: (property) =>
    set((state) => {
      const newState = {
        filters: state.filters.filter((f) => f.property !== property),
      };
      updateSearchParams(
        newState.filters,
        state.groupProperty,
        state.groupDirection,
      );
      return newState;
    }),
  clearFilters: () =>
    set((state) => {
      updateSearchParams([], state.groupProperty, state.groupDirection);
      return { filters: [] };
    }),

  // Group state
  groupProperty: null,
  groupDirection: "asc",
  setGroupProperty: (property) =>
    set((state) => {
      if (property === "none") {
        updateSearchParams(state.filters, null, state.groupDirection);
      } else {
        updateSearchParams(state.filters, property, state.groupDirection);
      }
      return { groupProperty: property };
    }),
  setGroupDirection: (direction) =>
    set((state) => {
      updateSearchParams(state.filters, state.groupProperty, direction);
      return { groupDirection: direction };
    }),

  // URL sync
  syncWithUrl: () => {
    // simulate a delay
    setTimeout(() => {
      const { filters, groupProperty, groupDirection } = parseSearchParams();
      set({
        filters,
        groupProperty,
        groupDirection: groupDirection as "asc" | "desc",
        hydrated: true,
      });
    }, 1000);
  },
  updateUrl: () => {
    const { filters, groupProperty, groupDirection } = get();
    updateSearchParams(filters, groupProperty, groupDirection);
  },

  // Helper function to get filtered and grouped locations
  getFilteredAndGroupedLocations: (
    locations,
    filters,
    groupProperty,
    groupDirection,
    databaseProperties,
  ) => {
    return filterAndGroupLocations(
      locations,
      filters,
      groupProperty,
      groupDirection,
      databaseProperties,
    );
  },
}));
