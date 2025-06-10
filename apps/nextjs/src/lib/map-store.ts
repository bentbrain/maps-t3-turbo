"use client";

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

interface MapState {
  // Map state
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
  mapInstance: google.maps.Map | null;
  setMapInstance: (map: google.maps.Map | null) => void;
  focusLocation: (lat: number, lng: number) => void;
  focusFromSidebar: (lat: number, lng: number, id: string) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  focusUserLocation: () => void;
  resetSelectedMarker: () => void;

  // Filter state
  filters: FilterState[];
  sortDirection: "asc" | "desc";

  // Filter actions
  updateFilter: (property: string, values: string[]) => void;
  updateNumberFilter: (
    property: string,
    operator: "gt" | "lt",
    value: number,
  ) => void;
  removeFilter: (property: string) => void;
  clearFilters: () => void;
  setSortDirection: (direction: "asc" | "desc") => void;

  // State initialization from URL
  initializeFromUrl: (
    filters: FilterState[],
    direction: "asc" | "desc",
  ) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Map state
  selectedMarkerId: null,
  setSelectedMarkerId: (id) => set({ selectedMarkerId: id }),
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  focusLocation: (lat, lng) => {
    const map = get().mapInstance;
    if (!map) return;

    map.panTo({ lat, lng });
    map.setZoom(17);
  },
  focusFromSidebar: (lat, lng, id) => {
    const { focusLocation, setSelectedMarkerId } = get();
    // First clear any existing selection to avoid conflicts
    setSelectedMarkerId(null);
    // Focus the location
    focusLocation(lat, lng);
    // Set the new selection after a delay to ensure DOM is ready
    setTimeout(() => {
      try {
        setSelectedMarkerId(id);
      } catch (error) {
        console.debug("Error setting selected marker:", error);
        // If there's an error, ensure we don't leave stale state
        setSelectedMarkerId(null);
      }
    }, 150);
  },
  focusUserLocation: () => {
    const { userLocation, focusLocation } = get();
    if (userLocation) {
      focusLocation(userLocation.lat, userLocation.lng);
    }
  },
  resetSelectedMarker: () => set({ selectedMarkerId: null }),

  // Filter state
  filters: [],
  sortDirection: "asc",

  // Filter actions - these now just update internal state
  updateFilter: (property, values) =>
    set((state) => {
      // Prevent updates if values haven't actually changed
      const existingFilter = state.filters.find((f) => f.property === property);
      if (
        existingFilter &&
        existingFilter.values.length === values.length &&
        existingFilter.values.every((v, i) => v === values[i])
      ) {
        return state; // No change needed
      }

      const newFilters = [
        ...state.filters.filter((f) => f.property !== property),
        { property, type: "select" as const, values },
      ];

      return { filters: newFilters, selectedMarkerId: null };
    }),

  updateNumberFilter: (property, operator, value) =>
    set((state) => {
      // Prevent updates if filter hasn't actually changed
      const existingFilter = state.filters.find((f) => f.property === property);
      if (
        existingFilter &&
        existingFilter.operator === operator &&
        existingFilter.value === value
      ) {
        return state; // No change needed
      }

      const newFilters = [
        ...state.filters.filter((f) => f.property !== property),
        { property, type: "number" as const, values: [], operator, value },
      ];

      return { filters: newFilters, selectedMarkerId: null };
    }),

  removeFilter: (property) =>
    set((state) => {
      // Check if filter actually exists
      if (!state.filters.some((f) => f.property === property)) {
        return state; // No change needed
      }

      const newFilters = state.filters.filter((f) => f.property !== property);
      return { filters: newFilters, selectedMarkerId: null };
    }),

  clearFilters: () =>
    set((state) => {
      // Don't clear if already empty
      if (state.filters.length === 0) {
        return state;
      }

      return { filters: [], selectedMarkerId: null };
    }),

  setSortDirection: (direction) =>
    set((state) => {
      // Don't update if direction hasn't changed
      if (state.sortDirection === direction) {
        return state;
      }

      return { sortDirection: direction };
    }),

  // Initialize state from URL (called by components with Next.js hooks)
  initializeFromUrl: (filters, direction) => {
    set({
      filters,
      sortDirection: direction,
    });
  },
}));
