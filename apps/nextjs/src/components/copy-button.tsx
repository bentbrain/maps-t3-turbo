"use client";

import { useState } from "react";
import { useSidebarStore } from "@/lib/sidebar-store";
import { CheckCircle, Filter, FilterX, Share } from "lucide-react";
import { toast } from "sonner";

import { env } from "@acme/env/env";
import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

function getShareUrl(shareHash: string, withFilters: boolean) {
  const base = `${env.NEXT_PUBLIC_SITE_URL}/share/${shareHash}`;
  if (!withFilters) return base;
  // Use current window's search params for filters/grouping
  if (typeof window === "undefined") return base;
  const params = window.location.search;
  return params ? `${base}${params}` : base;
}

export function CopyButton({ shareHash }: { shareHash: string }) {
  const { filters } = useSidebarStore();
  const [copied, setCopied] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  const hasFilters = filters.length > 0;

  const handleCopy = (type: "all" | "filtered") => {
    const url = getShareUrl(shareHash, type === "filtered");
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setIsOpen(false);
        setCopied(true);
        toast.success(
          type === "filtered"
            ? "Share link with filters copied!"
            : "Share link copied!",
        );
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  return (
    <div className="flex flex-col gap-2">
      {!hasFilters ? (
        <Button
          variant="outline"
          onClick={() => handleCopy("all")}
          aria-label="Copy share link"
        >
          <ShareContent copied={copied} />
        </Button>
      ) : (
        <Popover modal open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label="Copy share link options">
              <ShareContent copied={copied} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex w-(--radix-popover-trigger-width) flex-col p-1 text-center">
            <Button
              variant="ghost"
              onClick={() => handleCopy("filtered")}
              aria-label="Copy share link with filters"
              className="justify-between"
            >
              <span>With filters</span>
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleCopy("all")}
              aria-label="Copy share link"
              className="justify-between"
            >
              <span>Without filters</span>
              <FilterX className="h-4 w-4" />
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

const ShareContent = ({ copied }: { copied: boolean }) => {
  return (
    <>
      {copied ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Share className="h-4 w-4" />
      )}
      {copied ? "Copied!" : "Copy share link"}
    </>
  );
};
