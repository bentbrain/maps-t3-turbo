"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { useTRPC } from "@/trpc/react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useMultiSidebar } from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

function DatabaseSelect({
  userId,
  databaseId,
}: {
  userId?: string;
  databaseId?: string;
}) {
  const trpc = useTRPC();
  const {
    data: databases,
    isLoading,
    error,
  } = useQuery({
    ...trpc.user.getUserDatabasesFromNotion.queryOptions(),
    retry: 1, // Limit retries to avoid excessive error logs
  });

  const [open, setOpen] = useState(false);

  const { leftSidebar } = useMultiSidebar();

  const handleChange = (value: string) => {
    setOpen(false);
    redirect(`/${userId}/${value}`);
  };

  if (isLoading) {
    return <Skeleton className="mx-auto h-9 w-full max-w-sm" />;
  }

  if (error || !databases) {
    console.error("Error loading databases:", error);
    return (
      <Select disabled>
        <SelectTrigger className="mx-auto w-full max-w-sm">
          <SelectValue placeholder="Error loading databases" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <div
      className={cn("", {
        "pr-2": leftSidebar.isMobile,
      })}
    >
      <Select
        onValueChange={handleChange}
        value={databaseId ?? undefined}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger className="mx-auto w-full max-w-sm">
          <SelectValue placeholder="Select a database" />
        </SelectTrigger>
        <SelectContent>
          {databases.map((database) => (
            <SelectItem key={database.id} value={database.id}>
              {database.icon?.type === "emoji" && (
                <span className="text-xs">{database.icon.emoji}</span>
              )}
              <span className="truncate">{database.title[0]?.plain_text}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default DatabaseSelect;
