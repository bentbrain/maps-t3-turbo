"use client";

import { create } from "zustand";

interface MapState {
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
  mapInstance: google.maps.Map | null;
  setMapInstance: (map: google.maps.Map | null) => void;
  focusLocation: (lat: number, lng: number) => void;
  focusFromSidebar: (lat: number, lng: number, id: string) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  focusUserLocation: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
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
    focusLocation(lat, lng);
    setSelectedMarkerId(id);
  },
  focusUserLocation: () => {
    const { userLocation, focusLocation } = get();
    if (userLocation) {
      focusLocation(userLocation.lat, userLocation.lng);
    }
  },
}));
