"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { Button } from "@acme/ui/button";
import { useMultiSidebar } from "@acme/ui/sidebar";

export const SidebarToggleButton = () => {
  const { rightSidebar } = useMultiSidebar();
  return (
    <Button variant="outline" onClick={() => rightSidebar.toggleSidebar()}>
      {rightSidebar.open ? (
        <PanelRightClose className="h-4 w-4" />
      ) : (
        <PanelRightOpen className="h-4 w-4" />
      )}
      {rightSidebar.open ? "Close" : "Open"}
    </Button>
  );
};
