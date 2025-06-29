"use client";

import type { Location, MapBounds } from "@/lib/types";
import type { Marker } from "@googlemaps/markerclusterer";
import { useEffect, useRef } from "react";
import { useMapStore } from "@/lib/map-store";
import {
  filterLocations,
  getOffsetLocations,
  MAP_STYLES,
  markerIconEmojiMap,
} from "@/lib/map-utils";
import { useFilterUrlSync } from "@/lib/use-filter-url-sync";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";
import { createRoot } from "react-dom/client";

import { env } from "@acme/env/env";
import { useMultiSidebar } from "@acme/ui/sidebar";

import { CustomInfoWindow } from "./map/custom-info-window";
import { MarkerCluster } from "./map/marker-cluster";
import { UserLocationDot } from "./map/user-location-dot";

interface Props {
  locations: Location[];
  initialBounds: MapBounds;
  initialCenter: { lat: number; lng: number };
  sharePage?: boolean;
  clickZoomLevel?: number;
}

const ClusteredMarkers = ({
  locations,
  activeInfoWindow,
  onToggleInfoWindow,
  sharePage,
  clickZoomLevel = 16,
}: {
  locations: Location[];
  activeInfoWindow: string | null;
  onToggleInfoWindow: (isOpen: boolean, locationId: string) => void;
  sharePage?: boolean;
  clickZoomLevel?: number;
}) => {
  "use memo";
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const map = useMap();
  const { setSelectedMarkerId } = useMapStore();
  const prevLocationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!map) return;

    clustererRef.current = new MarkerClusterer({
      map,
      algorithm: new SuperClusterAlgorithm({ radius: 80 }),
      onClusterClick: (_, cluster) => {
        if (!cluster.markers) return;
        setSelectedMarkerId(null);

        const bounds = new google.maps.LatLngBounds();
        cluster.markers.forEach((marker) => {
          if (
            marker instanceof google.maps.marker.AdvancedMarkerElement &&
            marker.position
          ) {
            bounds.extend(marker.position);
          }
        });

        // Add padding to the bounds
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latPadding = (ne.lat() - sw.lat()) * 0.5;
        const lngPadding = (ne.lng() - sw.lng()) * 0.5;
        bounds.extend({
          lat: ne.lat() + latPadding,
          lng: ne.lng() + lngPadding,
        });
        bounds.extend({
          lat: sw.lat() - latPadding,
          lng: sw.lng() - lngPadding,
        });

        map.fitBounds(bounds);
        return true;
      },
      renderer: {
        render: ({ count, position, markers }) => {
          const size = Math.min(Math.max(48, count * 5), 120);
          const icons =
            markers
              ?.map((marker) => markerIconEmojiMap.get(marker))
              .filter((icon): icon is string => typeof icon === "string") ?? [];
          const iconSet = new Set(icons);

          const div = document.createElement("div");
          const root = createRoot(div);
          root.render(<MarkerCluster size={size} iconSet={iconSet} />);

          return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: div,
          });
        },
      },
    });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
      }
    };
  }, [map, setSelectedMarkerId]);

  // Clean up markers for locations that are no longer in the filtered list
  useEffect(() => {
    const currentLocationIds = new Set(locations.map((loc) => loc.id));
    const clusterer = clustererRef.current;

    if (clusterer) {
      // Remove markers for locations that are no longer in the current locations array
      prevLocationIdsRef.current.forEach((locationId) => {
        if (
          !currentLocationIds.has(locationId) &&
          markersRef.current[locationId]
        ) {
          try {
            clusterer.removeMarker(markersRef.current[locationId]);
          } catch (error) {
            console.debug(
              "Marker removal error during cleanup (safe to ignore):",
              error,
            );
          }
          delete markersRef.current[locationId];
        }
      });
    }

    // Update the previous location IDs for next comparison
    prevLocationIdsRef.current = currentLocationIds;
  }, [locations]);

  const handleMarkerRef = (marker: Marker | null, locationId: string) => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;

    // Always remove existing marker first to avoid duplicates
    if (markersRef.current[locationId]) {
      try {
        clusterer.removeMarker(markersRef.current[locationId]);
      } catch (error) {
        console.debug("Marker removal error (safe to ignore):", error);
      }
      delete markersRef.current[locationId];
    }

    // Add new marker if provided
    if (marker) {
      try {
        markersRef.current[locationId] = marker;
        clusterer.addMarker(marker);
      } catch (error) {
        console.debug("Marker addition error (safe to ignore):", error);
        delete markersRef.current[locationId];
      }
    }
  };

  return (
    <>
      {locations.map((loc) => (
        <MarkerWithInfoWindow
          key={loc.id}
          location={loc}
          isOpen={activeInfoWindow === loc.id}
          onToggle={(isOpen) => onToggleInfoWindow(isOpen, loc.id)}
          setMarkerRef={(marker) => handleMarkerRef(marker, loc.id)}
          sharePage={sharePage}
          clickZoomLevel={clickZoomLevel}
        />
      ))}
    </>
  );
};

const MarkerWithInfoWindow = ({
  location,
  isOpen,
  onToggle,
  setMarkerRef,
  sharePage,
  clickZoomLevel = 16,
}: {
  location: Location;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  setMarkerRef: (marker: Marker | null) => void;
  sharePage?: boolean;
  clickZoomLevel?: number;
}) => {
  "use memo";
  const [markerRef, marker] = useAdvancedMarkerRef();
  const map = useMap();

  // Handle map panning when marker is opened
  useEffect(() => {
    if (isOpen && map) {
      try {
        map.panTo({ lat: location.lat, lng: location.lng });
        map.setZoom(clickZoomLevel);
      } catch (error) {
        console.debug("Map pan error (safe to ignore):", error);
      }
    }
  }, [isOpen, map, location.lat, location.lng, clickZoomLevel]);

  const handleMarkerClick = (e: {
    domEvent: { stopPropagation: () => void };
  }) => {
    e.domEvent.stopPropagation();
    onToggle(!isOpen);
  };

  const handleClose = () => {
    onToggle(false);
  };

  // Handle marker registration with clusterer
  useEffect(() => {
    if (marker && location.icon) {
      markerIconEmojiMap.set(marker, location.icon);
    }
    setMarkerRef(marker);
  }, [marker, location.icon, setMarkerRef]);

  return (
    <AdvancedMarker
      ref={markerRef}
      onClick={handleMarkerClick}
      position={{ lat: location.lat, lng: location.lng }}
      className="relative max-w-full"
      zIndex={isOpen ? 1000 : 1}
    >
      <Pin
        background={"#000000"}
        borderColor={"#000000"}
        glyphColor={"#FFFFFF"}
        glyph={location.icon}
      />
      {isOpen && (
        <CustomInfoWindow
          key={`info-${location.id}`}
          location={location}
          isOpen={isOpen}
          onClose={handleClose}
          sharePage={sharePage}
        />
      )}
    </AdvancedMarker>
  );
};

export default function GoogleMapView({
  locations,
  initialBounds,
  initialCenter,
  sharePage = true,
  clickZoomLevel = 18,
}: Props) {
  "use memo";
  const { selectedMarkerId, setSelectedMarkerId, userLocation, filters } =
    useMapStore();

  // Handle URL synchronization with Next.js hooks
  useFilterUrlSync();

  // Apply filters and sorting in sequence
  const filteredLocations = filterLocations(locations, filters);
  const offsetLocations = getOffsetLocations(filteredLocations);

  const { leftSidebar, rightSidebar } = useMultiSidebar();

  const sidebarOpen =
    leftSidebar.state === "expanded" || rightSidebar.state === "expanded";

  return (
    <div
      className="h-full w-full bg-white p-0 transition-all data-[sidebar-state=true]:px-3 data-[sidebar-state=true]:pb-3"
      data-sidebar-state={leftSidebar.isMobile ? "mobile" : sidebarOpen}
    >
      <div
        className="h-full w-full overflow-hidden rounded-none transition-all data-[sidebar-state=true]:rounded-lg data-[sidebar-state=true]:shadow-sm"
        data-sidebar-state={leftSidebar.isMobile ? "mobile" : sidebarOpen}
      >
        <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
          <Map
            style={{ width: "100%", height: "100%" }}
            defaultCenter={initialCenter}
            defaultBounds={initialBounds}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId={env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
            onClick={() => {
              try {
                setSelectedMarkerId(null);
              } catch (error) {
                console.debug("Error clearing selected marker:", error);
              }
            }}
            onIdle={(e) => useMapStore.getState().setMapInstance(e.map)}
            styles={MAP_STYLES}
          >
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <UserLocationDot />
              </AdvancedMarker>
            )}
            {offsetLocations.length > 0 && (
              <ClusteredMarkers
                locations={offsetLocations}
                activeInfoWindow={selectedMarkerId}
                onToggleInfoWindow={(isOpen, locationId) =>
                  setSelectedMarkerId(isOpen ? locationId : null)
                }
                sharePage={sharePage}
                clickZoomLevel={clickZoomLevel}
              />
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
