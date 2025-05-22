"use client";

import type { Location } from "@/lib/get-initial-data";
import type { FuseResultMatch } from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { redirect } from "next/navigation";
import { useMapStore } from "@/lib/map-store";
import { useTRPC } from "@/trpc/react";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { Repeat } from "lucide-react";

import type { RouterOutputs } from "@acme/api";
import { cn, notionColourMap } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useCommandState,
} from "@acme/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

interface FilterOption {
  name: string;
  values?: { name: string; color: string; id: string }[];
}

function SearchBar({
  locations,
  selectedDatabaseId,
  userId,
}: {
  locations: Location[];
  selectedDatabaseId: string;
  userId: string;
}) {
  "use memo";
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { focusFromSidebar } = useMapStore();
  const { data: databases } = useQuery({
    ...trpc.user.getUserDatabasesFromNotion.queryOptions(),
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const searchResults = useMemo(() => {
    const fuse = new Fuse(locations, {
      keys: [
        "name",
        "address",
        "filterOptions.name",
        "filterOptions.values.name",
        "properties.type",
      ],
      includeMatches: true,
      threshold: 0.3,
    });

    if (!searchTerm) {
      // Return all locations in the same format as Fuse's results
      return locations.map((location) => ({
        item: location,
        matches: [],
      }));
    }
    try {
      const results = fuse.search(searchTerm);
      return results;
    } catch (error) {
      console.error(error);
      return [];
    }
  }, [searchTerm, locations]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  const renderHighlightedText = (
    text: string,
    matches: readonly FuseResultMatch[] = [],
  ) => {
    if (!matches.length) return text;

    const match = matches.find((m) => m.value === text);
    if (!match) return text;

    const parts: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;

    match.indices.forEach(([start, end]) => {
      if (start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, start), highlight: false });
      }
      parts.push({ text: text.slice(start, end + 1), highlight: true });
      lastIndex = end + 1;
    });

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight: false });
    }

    return (
      <>
        {parts.map((part, i) => (
          <span
            key={i}
            className={part.highlight ? "bg-yellow-200 dark:bg-yellow-800" : ""}
          >
            {part.text}
          </span>
        ))}
      </>
    );
  };

  return (
    <>
      <Button
        className="text-muted-foreground w-full justify-between text-xs"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <span>Search..</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search locations..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList className="@container">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Commands">
            <DatabaseCommand
              databases={databases}
              selectedDatabaseId={selectedDatabaseId}
              userId={userId}
            />
          </CommandGroup>
          <CommandGroup heading="Locations">
            {searchResults.map(({ item: location, matches }) => (
              <CommandItem
                key={location.id}
                onSelect={() => {
                  focusFromSidebar(location.lat, location.lng, location.id);
                  setOpen(false);
                }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{location.icon ?? "📍"}</span>
                  <span className="font-medium">
                    {renderHighlightedText(location.name, matches)}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {renderHighlightedText(location.address, matches)}
                </span>
                <div className="flex flex-wrap gap-1">
                  {location.filterOptions.length > 0 &&
                    location.filterOptions.map((option: FilterOption) =>
                      option.values?.map((value) => (
                        <Badge
                          key={`${option.name}-${value.name}`}
                          className={cn(
                            "gap-0",
                            notionColourMap[
                              value.color as keyof typeof notionColourMap
                            ].bg,
                            notionColourMap[
                              value.color as keyof typeof notionColourMap
                            ].text,
                          )}
                        >
                          {renderHighlightedText(value.name, matches)}
                        </Badge>
                      )),
                    )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default SearchBar;

const DatabaseCommand = ({
  databases,
  selectedDatabaseId,
  userId,
}: {
  databases: RouterOutputs["user"]["getUserDatabasesFromNotion"] | undefined;
  selectedDatabaseId: string;
  userId: string;
}) => {
  "use memo";
  const [open, setOpen] = useState(false);
  const commandItemRef = useRef<HTMLDivElement>(null);
  const selectTriggerRef = useRef<HTMLButtonElement>(null);

  const selectedValue = useCommandState((state) => state.value) as
    | string
    | undefined;

  if (!databases || databases.length === 1) {
    return null;
  }

  const handleChange = (value: string) => {
    setOpen(false);
    redirect(`/${userId}/${value}`);
  };

  const handleSelectOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        selectTriggerRef.current?.blur();
        commandItemRef.current?.focus();
      }, 100);
    }
  };

  return (
    <CommandItem
      ref={commandItemRef}
      tabIndex={-1}
      onSelect={() => setOpen(true)}
      className="flex flex-col items-start justify-between gap-4 @sm:flex-row @sm:items-center"
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-2 font-medium">
          <Repeat className="size-2" /> Change database
        </span>
      </div>
      <Select
        open={open}
        onOpenChange={handleSelectOpenChange}
        defaultValue={selectedDatabaseId}
        onValueChange={handleChange}
      >
        <SelectTrigger
          tabIndex={selectedValue?.includes("Change database") ? 0 : -1}
          ref={selectTriggerRef}
          className="w-full @sm:w-[180px]"
        >
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent portal={false}>
          {databases.map((database) => (
            <SelectItem key={database.id} value={database.id}>
              {database.title[0]?.plain_text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CommandItem>
  );
};
