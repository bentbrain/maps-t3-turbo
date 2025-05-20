"use client";

import { useMapStore } from "@/lib/map-store";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";

export function SidebarUserLocation() {
  const { userLocation, focusUserLocation, setUserLocation } = useMapStore();

  const handleClick = () => {
    if (userLocation) {
      focusUserLocation();
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          // Optionally, focus immediately after setting
          focusUserLocation();
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            toast.error("Please allow location access to use this feature.");
          } else {
            toast.error("Unable to retrieve your location.");
          }
        },
      );
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleClick}>
      Current location
      <LocateFixed aria-hidden="true" className="h-4 w-4" />
    </Button>
  );
}
