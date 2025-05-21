"use client";

import type { Location } from "@/lib/get-initial-data";
import type { FuseResultMatch } from "fuse.js";
import React, { useEffect, useMemo, useState } from "react";
import { useMapStore } from "@/lib/map-store";
import Fuse from "fuse.js";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";

interface FilterOption {
  name: string;
  values?: { name: string; color: string; id: string }[];
}

function SearchBar({ locations }: { locations: Location[] }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { focusFromSidebar } = useMapStore();

  const fuse = useMemo(() => {
    return new Fuse(locations, {
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
  }, [locations]);

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
    if (!searchTerm) return [];
    try {
      const results = fuse.search(searchTerm);
      return results;
    } catch (error) {
      console.error(error);
      return [];
    }
  }, [fuse, searchTerm]);

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
      <button
        onClick={() => setOpen(true)}
        className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full rounded-lg border px-3 py-2 text-sm shadow-sm"
      >
        <span className="hidden lg:inline-flex">Search locations...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="bg-muted pointer-events-none absolute top-2.5 right-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search locations..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults.length > 0 && (
            <CommandGroup heading="Locations">
              {searchResults.map(({ item: location, matches }) => (
                <CommandItem
                  key={location.id}
                  onSelect={() => {
                    focusFromSidebar(location.lat, location.lng, location.id);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2 text-lg">{location.icon ?? "📍"}</span>
                  <span className="mr-2 font-medium">
                    {renderHighlightedText(location.name, matches)}
                  </span>
                  <span className="text-muted-foreground mr-2 text-sm">
                    {renderHighlightedText(location.address, matches)}
                  </span>
                  {location.filterOptions.length > 0 &&
                    location.filterOptions.map((option: FilterOption) =>
                      option.values?.map((value) => (
                        <span
                          key={`${option.name}-${value.name}`}
                          className="bg-muted mr-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        >
                          {renderHighlightedText(value.name, matches)}
                        </span>
                      )),
                    )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default SearchBar;
