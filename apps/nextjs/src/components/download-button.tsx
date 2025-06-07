"use client";

import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import { useTRPC } from "@/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";

import type { buttonVariants } from "@acme/ui/button";
import { Button } from "@acme/ui/button";

export function DownloadButton({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const trpc = useTRPC();

  const latestRelease = useQuery(trpc.releases.getLatestRelease.queryOptions());

  return (
    <Button
      variant={variant}
      asChild
      size={size}
      className={className}
      {...props}
    >
      <Link href={latestRelease.data?.asset?.url ?? ""}>
        <Download className="mr-2 h-4 w-4" />
        Download latest
      </Link>
    </Button>
  );
}
