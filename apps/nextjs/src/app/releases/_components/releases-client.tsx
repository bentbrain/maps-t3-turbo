"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@acme/ui/button";

interface ReleasesClientProps {
  currentPage: number;
  hasMoreReleases: boolean;
}

export function ReleasesClient({
  currentPage,
  hasMoreReleases,
}: ReleasesClientProps) {
  const router = useRouter();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      router.push(newPage === 1 ? "/releases" : `/releases?page=${newPage}`);
    }
  };

  const handleNextPage = () => {
    router.push(`/releases?page=${currentPage + 1}`);
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>

      <span className="text-muted-foreground text-sm">Page {currentPage}</span>

      <Button
        variant="outline"
        onClick={handleNextPage}
        disabled={!hasMoreReleases}
      >
        Next
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
