"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useTRPC } from "@/trpc/react";
import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Skeleton } from "@acme/ui/skeleton";

function DatabaseSelect({ userId }: { userId?: string }) {
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
  const sidebarStore = useSidebarStore();
  const handleChange = (value: string) => {
    sidebarStore.setSelectedDatabaseId(value);
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
        <SelectTrigger className="mx-auto w-full max-w-sm group-has-[.disable-layout-features]/root:hidden">
          <SelectValue placeholder="Error loading databases" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      onValueChange={handleChange}
      value={sidebarStore.selectedDatabaseId ?? undefined}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="mx-auto w-full max-w-sm group-has-[.disable-layout-features]/root:hidden">
        <SelectValue placeholder="Select a database" />
      </SelectTrigger>
      <SelectContent>
        {databases.map((database) => (
          <SelectItem key={database.id} value={database.id}>
            {database.icon?.type === "emoji" && (
              <span className="text-xs">{database.icon.emoji}</span>
            )}
            <span>{database.title[0]?.plain_text}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default DatabaseSelect;
