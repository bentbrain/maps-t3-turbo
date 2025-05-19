"use client";

import Link from "next/link";
import { getNotionUrl } from "@/lib/get-initial-data";
import { useSidebarStore } from "@/lib/sidebar-store";
import { Notion } from "@ridemountainpig/svgl-react";

import { Button } from "@acme/ui/button";
import { SidebarTrigger } from "@acme/ui/sidebar";

import { CopyButton } from "./copy-button";

export const SidebarButtonWrapper = () => {
  const sidebarStore = useSidebarStore();

  if (!sidebarStore.selectedDatabaseId) {
    return null;
  }
  return (
    <>
      <CopyButton databaseId={sidebarStore.selectedDatabaseId} />
      <Button variant={"outline"} asChild>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href={getNotionUrl(sidebarStore.selectedDatabaseId)}
        >
          <Notion className="inline h-4 w-4" /> Edit in Notion
        </Link>
      </Button>
    </>
  );
};

export const RightSidebarTrigger = () => {
  const { selectedDatabaseId } = useSidebarStore();
  if (!selectedDatabaseId) {
    return null;
  }
  return <SidebarTrigger side="left" />;
};
