"use client";

import Link from "next/link";
import { getNotionUrl } from "@/lib/get-initial-data";
import { Notion } from "@ridemountainpig/svgl-react";

import { Button } from "@acme/ui/button";
import { SidebarTrigger } from "@acme/ui/sidebar";

import { CopyButton } from "./copy-button";

export const SidebarButtonWrapper = ({
  databaseId,
}: {
  databaseId: string;
}) => {
  return (
    <>
      <CopyButton databaseId={databaseId} />
      <Button variant={"outline"} asChild>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href={getNotionUrl(databaseId)}
        >
          <Notion className="inline h-4 w-4" /> Edit in Notion
        </Link>
      </Button>
    </>
  );
};

export const RightSidebarTrigger = () => {
  return <SidebarTrigger side="left" />;
};
