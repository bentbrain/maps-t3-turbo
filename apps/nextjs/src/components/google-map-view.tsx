"use client";

import type { Location, MapBounds } from "@/lib/get-initial-data";
import type { DatabaseProperty } from "@/lib/sidebar-store";
import type { Marker } from "@googlemaps/markerclusterer";
import { Fragment, useEffect, useRef, useState } from "react";
import { useMapStore } from "@/lib/map-store";
import {
  filterLocations,
  getOffsetLocations,
  MAP_STYLES,
  markerIconEmojiMap,
} from "@/lib/map-utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";
import { createRoot } from "react-dom/client";

import { env } from "@acme/env/env";

import { MarkerCluster } from "./map/marker-cluster";
import { MarkerInfoWindow } from "./map/marker-info-window";
import { UserLocationDot } from "./map/user-location-dot";

interface Props {
  locations: Location[];
  initialBounds: MapBounds;
  initialCenter: { lat: number; lng: number };
  databaseProperties: Record<string, DatabaseProperty>;
  sharePage?: boolean;
}

const ClusteredMarkers = ({
  locations,
  activeInfoWindow,
  onToggleInfoWindow,
  sharePage,
}: {
  locations: Location[];
  activeInfoWindow: string | null;
  onToggleInfoWindow: (isOpen: boolean, locationId: string) => void;
  sharePage?: boolean;
}) => {
  "use memo";
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const map = useMap();
  const { setSelectedMarkerId } = useMapStore();

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

  const handleMarkerRef = (marker: Marker | null, locationId: string) => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;

    if (!marker) {
      if (markersRef.current[locationId]) {
        clusterer.removeMarker(markersRef.current[locationId]);
        delete markersRef.current[locationId];
      }
    } else {
      if (!markersRef.current[locationId]) {
        markersRef.current[locationId] = marker;
        clusterer.addMarker(marker);
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
}: {
  location: Location;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  setMarkerRef: (marker: Marker | null) => void;
  sharePage?: boolean;
}) => {
  "use memo";
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const map = useMap();

  // Handle external state changes (e.g. from sidebar)
  useEffect(() => {
    setLocalIsOpen(isOpen);
  }, [isOpen]);

  // Handle map panning when marker is opened
  useEffect(() => {
    if (localIsOpen && map) {
      map.panTo({ lat: location.lat, lng: location.lng });
      map.setZoom(16);
    }
  }, [localIsOpen, map, location.lat, location.lng]);

  const handleMarkerClick = (e: {
    domEvent: { stopPropagation: () => void };
  }) => {
    e.domEvent.stopPropagation();
    const newIsOpen = !localIsOpen;
    setLocalIsOpen(newIsOpen);
    onToggle(newIsOpen);
  };

  useEffect(() => {
    if (marker && location.icon) {
      markerIconEmojiMap.set(marker, location.icon);
    }
    setMarkerRef(marker);
    return () => setMarkerRef(null);
  }, [marker, setMarkerRef, location.icon]);

  return (
    <Fragment>
      <AdvancedMarker
        ref={markerRef}
        onClick={handleMarkerClick}
        position={{ lat: location.lat, lng: location.lng }}
        className="max-w-full"
      >
        <Pin
          background={"#000000"}
          borderColor={"#000000"}
          glyphColor={"#FFFFFF"}
          glyph={location.icon}
          scale={1.1}
        />
        {localIsOpen && (
          <InfoWindow
            className="@container w-72 max-w-full"
            anchor={marker}
            onCloseClick={() => {
              setLocalIsOpen(false);
              onToggle(false);
            }}
          >
            <MarkerInfoWindow location={location} sharePage={sharePage} />
          </InfoWindow>
        )}
      </AdvancedMarker>
    </Fragment>
  );
};
export default function GoogleMapView({
  locations,
  initialBounds,
  initialCenter,
  sharePage = true,
}: Props) {
  "use memo";
  const { selectedMarkerId, setSelectedMarkerId, userLocation } = useMapStore();
  const { syncWithUrl, filters } = useSidebarStore();

  useEffect(() => {
    syncWithUrl();
  }, [syncWithUrl]);

  // Apply filters and sorting in sequence
  const filteredLocations = filterLocations(locations, filters);
  const offsetLocations = getOffsetLocations(filteredLocations);

  return (
    <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <Map
        style={{ width: "100%", height: "100%" }}
        defaultCenter={initialCenter}
        defaultBounds={initialBounds}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId={env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
        onClick={() => setSelectedMarkerId(null)}
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
          />
        )}
      </Map>
    </APIProvider>
  );
}
