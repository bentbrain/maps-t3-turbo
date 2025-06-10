"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { Button } from "@acme/ui/button";
import { useMultiSidebar } from "@acme/ui/sidebar";

export const SidebarToggleButton = () => {
  const { rightSidebar } = useMultiSidebar();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    rightSidebar.toggleSidebar();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const isOpen = rightSidebar.isMobile
    ? rightSidebar.openMobile
    : rightSidebar.open;

  return (
    <Button
      className="cursor-pointer touch-manipulation bg-white/30 backdrop-blur-sm"
      variant="ghost"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
    >
      {isOpen ? (
        <PanelRightClose className="h-4 w-4" />
      ) : (
        <PanelRightOpen className="h-4 w-4" />
      )}
      {isOpen ? "Close" : "Open"}
    </Button>
  );
};
