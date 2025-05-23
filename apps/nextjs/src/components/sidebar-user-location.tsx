"use client";

import { useMapStore } from "@/lib/map-store";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";

import { SidebarMenuButton, SidebarMenuItem } from "@acme/ui/sidebar";

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
    <SidebarMenuItem key="user-location">
      <SidebarMenuButton
        className="cursor-pointer items-start"
        isActive={false}
        onClick={handleClick}
      >
        <div className="grid w-full grid-cols-[1fr_auto] gap-2">
          <h3 className="overflow-hidden font-medium text-nowrap text-ellipsis">
            Current location
          </h3>
          <LocateFixed
            aria-hidden="true"
            className="text-muted-foreground h-4 w-4"
          />
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
