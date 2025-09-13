"use client";

import { useMultiSidebar } from "@acme/ui/sidebar";

import type { MapComponentProps } from "./google-map-view";
import GoogleMapView from "./google-map-view";

function MapClientWrapper(
  props: Omit<MapComponentProps, "sidebarOpen" | "leftSidebarIsMobile">,
) {
  const { leftSidebar, rightSidebar } = useMultiSidebar();
  const leftSidebarIsMobile = leftSidebar.isMobile;

  const sidebarOpen =
    leftSidebar.state === "expanded" || rightSidebar.state === "expanded";
  return (
    <GoogleMapView
      {...props}
      sidebarOpen={sidebarOpen}
      leftSidebarIsMobile={leftSidebarIsMobile}
    />
  );
}

export default MapClientWrapper;
