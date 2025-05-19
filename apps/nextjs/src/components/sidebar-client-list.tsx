"use client";

import type { Location } from "@/lib/get-initial-data";
import type { DatabaseProperty } from "@/lib/sidebar-store";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMapStore } from "@/lib/map-store";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useTRPC } from "@/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@acme/ui/select";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { SidebarFilterSort } from "./sidebar-filter-sort";

function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-2">
      {/* Tabs Skeleton */}
      <div className="mb-2 flex gap-2">
        <Skeleton className="h-8 w-24" />
        <div className="relative">
          <Skeleton className="h-8 w-24" />
          <div className="absolute -top-2 -right-2">
            <Skeleton className="flex h-5 w-5 items-center justify-center rounded-full">
              <Skeleton className="h-3 w-3 rounded-full" />
            </Skeleton>
          </div>
        </div>
      </div>

      {/* Group Controls Skeleton */}
      <div className="mb-4 flex items-center gap-2 px-2">
        <Skeleton className="h-10 w-40" /> {/* Select */}
        <Skeleton className="h-10 w-10" /> {/* Button */}
      </div>

      {/* Groups Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, groupIdx) => (
          <div key={groupIdx}>
            {/* Group Label */}
            <Skeleton className="mb-2 ml-2 h-5 w-24" />
            {/* Group Items */}
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, itemIdx) => (
                <Skeleton key={itemIdx} className="h-12" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Filters Tab Skeleton (shown when filters tab is active) */}
      {/* You could conditionally render a different skeleton here if you want to mimic the filters UI more closely */}
    </div>
  );
}

function LocationList({ locations }: { locations: Location[] }) {
  const { selectedMarkerId, focusFromSidebar } = useMapStore();
  const {
    getFilteredAndGroupedLocations,
    groupProperty,
    filters,
    groupDirection,
    hydrated,
    databaseProperties,
  } = useSidebarStore();

  const filteredLocations = getFilteredAndGroupedLocations(
    locations,
    filters,
    groupProperty,
    groupDirection,
    databaseProperties,
  );

  // Check if we're grouping by a multi-select field by looking at database properties
  const groupPropertyDef = groupProperty
    ? databaseProperties[groupProperty]
    : null;
  const isMultiSelectGroup =
    groupPropertyDef && groupPropertyDef.type === "multi_select";

  if (!hydrated) {
    return <SidebarSkeleton />;
  }

  if (!isMultiSelectGroup) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredLocations.map((location) => (
              <SidebarMenuItem key={location.id}>
                <SidebarMenuButton
                  className="cursor-pointer items-start"
                  isActive={selectedMarkerId === location.id}
                  onClick={() =>
                    focusFromSidebar(location.lat, location.lng, location.id)
                  }
                >
                  <div className="grid w-full grid-cols-[1fr_auto] gap-2">
                    <h3 className="overflow-hidden font-medium text-nowrap text-ellipsis">
                      {location.name}
                    </h3>
                    <p>{location.icon}</p>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Find active filter for the current group property
  const activeFilter = filters.find((f) => f.property === groupProperty);

  // Get all unique values for the group property from database properties
  const allValues = new Set<string>();
  if (groupPropertyDef.multi_select?.options) {
    groupPropertyDef.multi_select.options.forEach((option) => {
      allValues.add(option.name);
    });
  }

  // Group locations by their values (a location can appear in multiple groups)
  const groupedLocations: Record<string, Location[]> = {};
  const otherLocations: Location[] = [];

  filteredLocations.forEach((location) => {
    const filterOption = location.filterOptions.find(
      (opt) => opt.name === groupProperty,
    );

    if (!filterOption || filterOption.values.length === 0) {
      otherLocations.push(location);
    } else {
      const values = filterOption.values;
      values.forEach((value) => {
        const key = value.name;
        groupedLocations[key] ??= [];
        groupedLocations[key].push(location);
      });
    }
  });

  // Sort the groups alphabetically
  const sortedGroupsRaw = Object.entries(groupedLocations).sort(([a], [b]) =>
    groupDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a),
  );

  // Only show groups that are selected in the filter (if any)
  const sortedGroups =
    activeFilter && activeFilter.values.length > 0
      ? sortedGroupsRaw.filter(([groupName]) =>
          activeFilter.values.includes(groupName),
        )
      : sortedGroupsRaw;

  // Only show "Other" group if there are no active filters
  if (
    otherLocations.length > 0 &&
    (!activeFilter || activeFilter.values.length === 0)
  ) {
    sortedGroups.push(["Other", otherLocations]);
  }

  return (
    <>
      {sortedGroups.map(([groupName, groupLocations]) => (
        <SidebarGroup key={groupName}>
          <SidebarGroupLabel>
            <span className="overflow-hidden text-nowrap text-ellipsis">
              {groupName}
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupLocations.map((location) => (
                <SidebarMenuItem key={location.id}>
                  <SidebarMenuButton
                    className="cursor-pointer items-start"
                    isActive={selectedMarkerId === location.id}
                    onClick={() =>
                      focusFromSidebar(location.lat, location.lng, location.id)
                    }
                  >
                    <div className="grid w-full grid-cols-[1fr_auto] gap-2">
                      <h3 className="overflow-hidden font-medium text-nowrap text-ellipsis">
                        {location.name}
                      </h3>
                      <p>{location.icon}</p>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

export function SidebarClientList() {
  const params = useParams<{ userId: string }>();
  const trpc = useTRPC();
  const {
    filters,
    groupProperty,
    setGroupProperty,
    syncWithUrl,
    hydrated,
    locations,
    selectedDatabaseId,
    setDatabaseProperties,
    databaseProperties,
  } = useSidebarStore();

  // Fetch database properties
  const { data } = useQuery({
    ...trpc.user.getDatabaseProperties.queryOptions({
      databaseId: selectedDatabaseId ?? "",
      userId: params.userId,
    }),
    enabled: !!selectedDatabaseId && !!params.userId,
  });

  // Update database properties when data changes
  useEffect(() => {
    if (data) {
      setDatabaseProperties(data as Record<string, DatabaseProperty>);
    }
  }, [data, setDatabaseProperties]);

  useEffect(() => {
    syncWithUrl();
  }, [syncWithUrl]);

  if (!hydrated) {
    return <SidebarSkeleton />;
  }

  if (locations.length === 0) {
    return null;
  }

  // Get all available filter options from database properties
  const allFilterOptions = Object.entries(databaseProperties)
    .filter(
      ([_, prop]) => prop.type === "select" || prop.type === "multi_select",
    )
    .map(([key, prop]) => ({
      name: key,
      type: prop.type,
      options:
        prop.type === "select"
          ? prop.select?.options
          : prop.multi_select?.options,
    }));

  // If there are no filter options, just show the simple location list
  if (allFilterOptions.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {locations.map((location) => (
              <SidebarMenuItem key={location.id}>
                <SidebarMenuButton
                  className="cursor-pointer items-start"
                  isActive={false}
                  onClick={() =>
                    useMapStore
                      .getState()
                      .focusFromSidebar(location.lat, location.lng, location.id)
                  }
                >
                  <div className="grid w-full grid-cols-[1fr_auto] gap-2">
                    <h3 className="overflow-hidden font-medium text-nowrap text-ellipsis">
                      {location.name}
                    </h3>
                    <p>{location.icon}</p>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Tabs className="pl-2" defaultValue="locations">
      <TabsList className="mr-2 w-full">
        <TabsTrigger value="locations">Locations</TabsTrigger>
        <TabsTrigger value="filters">
          Filters
          {filters.length > 0 && (
            <Badge variant="secondary">
              {filters.reduce(
                (count: number, filter: { values: string[] }) =>
                  count + filter.values.length,
                0,
              )}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent className="pr-2" value="locations">
        {/* Group Controls */}
        <Select value={groupProperty ?? ""} onValueChange={setGroupProperty}>
          <SelectTrigger className="w-full">
            <Layers className="mr-2 h-4 w-4" />
            {groupProperty && groupProperty !== "none" ? (
              <span className="truncate">{groupProperty}</span>
            ) : (
              <span className="text-muted-foreground">Group by...</span>
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {allFilterOptions.map((filterOption) => (
              <SelectItem key={filterOption.name} value={filterOption.name}>
                {filterOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <LocationList locations={locations} />
      </TabsContent>
      <TabsContent className="pr-2" value="filters">
        <SidebarFilterSort locations={locations} />
      </TabsContent>
    </Tabs>
  );
}
