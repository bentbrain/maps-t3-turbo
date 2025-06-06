"use client";

import { useTRPC } from "@/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { Button } from "@acme/ui/button";

interface DownloadButtonProps {
  assetId: number;
  assetName: string;
}

export function DownloadButton({ assetId, assetName }: DownloadButtonProps) {
  const trpc = useTRPC();

  const generateUrlMutation = useMutation(
    trpc.releases.generateDownloadUrl.mutationOptions(),
  );

  const handleDownload = () => {
    generateUrlMutation.mutate(
      { assetId },
      {
        onSuccess: (result) => {
          // Create a temporary link and trigger download
          const link = document.createElement("a");
          link.href = result.downloadUrl;
          link.download = result.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
        onError: (error) => {
          console.error("Failed to generate download URL:", error);
        },
      },
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={generateUrlMutation.isPending}
    >
      <Download className="mr-2 h-4 w-4" />
      {generateUrlMutation.isPending ? "Downloading..." : assetName}
    </Button>
  );
}
