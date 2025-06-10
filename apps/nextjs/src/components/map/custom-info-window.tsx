import type { Location } from "@/lib/types";

import { MarkerInfoWindow } from "./marker-info-window";

interface CustomInfoWindowProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  sharePage?: boolean;
}

export const CustomInfoWindow = ({
  location,
  isOpen,
  onClose,
  sharePage,
}: CustomInfoWindowProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="custom-info-window pointer-events-auto absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
      <div className="@container relative w-[calc(100vw-40px)] max-w-xs rounded-lg border bg-white/40 shadow-lg backdrop-blur-sm sm:min-w-sm">
        <div className="p-4">
          <MarkerInfoWindow
            location={location}
            sharePage={sharePage}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
