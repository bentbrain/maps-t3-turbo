"use client";

import type { Location } from "@/lib/get-initial-data";
import type { FuseResultMatch } from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getNotionUrl } from "@/lib/get-initial-data";
import { useMapStore } from "@/lib/map-store";
import { useTRPC } from "@/trpc/react";
import { Notion } from "@ridemountainpig/svgl-react";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { ChevronDown, CornerDownLeft, Repeat, Search } from "lucide-react";

import type { RouterOutputs } from "@acme/api";
import { cn, notionColourMap } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Collapsible, CollapsibleContent } from "@acme/ui/collapsible";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import { useIsMobile } from "@acme/ui/sidebar";

interface FilterOption {
  name: string;
  values?: { name: string; color: string; id: string }[];
}

function SearchBar({
  locations,
  userId,
  selectedDatabaseId,
}: {
  locations: Location[];
  selectedDatabaseId: string;
  userId: string;
}) {
  "use memo";
  const trpc = useTRPC();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { focusFromSidebar } = useMapStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);
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
        <span className="flex items-center gap-2">
          <Search className="size-3" /> Search..
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search locations..."
          value={searchTerm}
          ref={inputRef}
          onValueChange={setSearchTerm}
          className="text-base sm:text-sm"
        />
        <CommandList
          ref={commandListRef}
          onScroll={() => {
            if (isMobile) {
              inputRef.current?.blur();
              commandListRef.current?.focus();
            }
          }}
          className="@container [scrollbar-color:var(--muted-foreground)_rgba(0,0,0,0)]"
        >
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Commands">
            <DatabaseCommand
              databases={databases}
              userId={userId}
              selectedDatabaseId={selectedDatabaseId}
            />
            <CommandItem
              onSelect={() => {
                redirect(getNotionUrl(selectedDatabaseId));
              }}
              asChild
            >
              <Link
                className="flex w-full items-center justify-between gap-2"
                href={getNotionUrl(selectedDatabaseId)}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium">
                    <Notion className="w-2" /> Open database in Notion
                  </span>
                </div>
                <CornerDownLeft
                  width={8}
                  height={8}
                  className="text-muted-foreground size-3!"
                />
              </Link>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Locations">
            {searchResults.map(({ item: location, matches }) => (
              <CommandItem
                key={location.id}
                onSelect={() => {
                  focusFromSidebar(location.lat, location.lng, location.id);
                  setOpen(false);
                }}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex flex-col items-start gap-2 overflow-hidden">
                    <div className="flex w-full items-center gap-2">
                      <span className="text-lg">{location.icon ?? "📍"}</span>
                      <span className="w-full truncate font-medium">
                        {renderHighlightedText(location.name, matches)}
                      </span>
                    </div>
                    <span className="text-muted-foreground w-full truncate text-xs">
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
                  </div>
                  <CornerDownLeft
                    width={8}
                    height={8}
                    className="text-muted-foreground size-3!"
                  />
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
  userId,
  selectedDatabaseId,
}: {
  databases: RouterOutputs["user"]["getUserDatabasesFromNotion"] | undefined;
  userId: string;
  selectedDatabaseId: string;
}) => {
  "use memo";
  const [open, setOpen] = useState(false);

  if (!databases || databases.length === 1) {
    return null;
  }
  return (
    <>
      <CommandItem
        key={"database-collapsible-trigger"}
        onSelect={() => setOpen((prev) => !prev)}
        className="order-1 flex flex-col items-start justify-between gap-4 @sm:flex-row @sm:items-center"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <Repeat className="w-2" /> Change database
          </span>
          <div>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-3! transition-transform",
                open && "rotate-180",
              )}
            />
          </div>
        </div>
      </CommandItem>
      <Collapsible
        key={"database-collapsible-content"}
        open={open}
        onOpenChange={setOpen}
      >
        <CollapsibleContent className="pl-2">
          {databases.map((database) => (
            <CommandItem
              disabled={database.id === selectedDatabaseId}
              onSelect={() => {
                console.log(database.id);
                redirect(`/${userId}/${database.id}`);
              }}
              asChild
              key={database.id}
            >
              <Link
                className="justify-baseline gap-3 text-xs"
                href={`/${userId}/${database.id}`}
              >
                <div className="flex w-full items-center gap-2">
                  {database.icon?.type === "emoji" && (
                    <span className="text-sm">{database.icon.emoji}</span>
                  )}
                  {database.title[0]?.plain_text}
                  {database.id === selectedDatabaseId && (
                    <span className="text-muted-foreground text-xs">
                      (current)
                    </span>
                  )}
                  <span className="text-muted-foreground hidden text-xs">
                    {database.id}
                  </span>
                </div>
                {database.id !== selectedDatabaseId && (
                  <span className="text-muted-foreground">
                    <CornerDownLeft className="size-3!" />
                  </span>
                )}
              </Link>
            </CommandItem>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
