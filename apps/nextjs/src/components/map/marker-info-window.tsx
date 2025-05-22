import type { Location } from "@/lib/get-initial-data";
import { MapIcon } from "lucide-react";

import type { notionColourMap } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import { SidebarToggleButton } from "../sidebar-toggle-button";

interface MarkerInfoWindowProps {
  location: Location;
  sharePage?: boolean;
}

export const MarkerInfoWindow = ({
  location,
  sharePage,
}: MarkerInfoWindowProps) => (
  <div className="grid max-w-full gap-3 font-sans">
    <div>
      <p className="text-2xl">{location.icon}</p>
      <h3 className="text-lg font-bold text-balance">
        <a href={location.notionUrl} target="_blank" rel="noopener noreferrer">
          {location.name}
        </a>
      </h3>
    </div>
    <div className="flex flex-wrap gap-1">
      {location.filterOptions.map((option) =>
        option.values?.map((value) => (
          <Badge
            key={`${option.name}-${value.id}`}
            color={value.color as keyof typeof notionColourMap}
            variant="secondary"
          >
            <span className="max-w-[15ch] overflow-hidden text-nowrap text-ellipsis">
              {value.name}
            </span>
          </Badge>
        )),
      )}
    </div>
    <div className="grid gap-2 @2xs:grid-cols-2">
      <Button asChild variant="outline">
        <a
          href={`https://google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${location.name} ${location.address}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <MapIcon className="inline h-4 w-4" /> Directions
        </a>
      </Button>

      {!sharePage && <SidebarToggleButton />}
    </div>
  </div>
);
