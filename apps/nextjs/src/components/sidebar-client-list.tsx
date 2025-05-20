"use client";

import type { Location } from "@/lib/get-initial-data";
import type { DatabaseProperty } from "@/lib/sidebar-store";
import { useState } from "react";
import { useMapStore } from "@/lib/map-store";
import { filterLocations, sortLocations } from "@/lib/map-utils";
import { useSidebarStore } from "@/lib/sidebar-store";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { SidebarFilterSort } from "./sidebar-filter-sort";

function LocationList({
  locations,
  databaseProperties,
  groupBy,
}: {
  locations: Location[];
  databaseProperties: Record<string, DatabaseProperty>;
  groupBy: string | null;
}) {
  const { selectedMarkerId, focusFromSidebar } = useMapStore();
  const { filters, sortDirection } = useSidebarStore();

  // Apply filters and sorting in sequence
  const filteredLocations = filterLocations(locations, filters);
  const sortedLocations = sortLocations(
    filteredLocations,
    groupBy,
    sortDirection,
    databaseProperties,
  );

  // Check if we're grouping by a select or multi-select field
  const groupPropertyDef = groupBy ? databaseProperties[groupBy] : null;

  if (
    !groupPropertyDef ||
    (groupPropertyDef.type !== "select" &&
      groupPropertyDef.type !== "multi_select")
  ) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {sortedLocations.map((location) => (
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
  const activeFilter = filters.find((f) => f.property === groupBy);

  // Group locations by their values (a location can appear in multiple groups for multi-select)
  const groupedLocations: Record<string, Location[]> = {};
  const otherLocations: Location[] = [];

  sortedLocations.forEach((location) => {
    const filterOption = location.filterOptions.find(
      (opt) => opt.name === groupBy,
    );

    const values = filterOption?.values;
    if (!values?.length) {
      otherLocations.push(location);
      return;
    }

    if (groupPropertyDef.type === "multi_select") {
      // For multi-select, add to all matching groups
      values.forEach((value) => {
        const key = value.name;
        groupedLocations[key] ??= [];
        groupedLocations[key].push(location);
      });
    } else {
      values.forEach((value) => {
        const key = value.name;
        groupedLocations[key] ??= [];
        groupedLocations[key].push(location);
      });
    }
  });

  // Sort the groups alphabetically
  const sortedGroupsRaw = Object.entries(groupedLocations).sort(([a], [b]) =>
    sortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a),
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

export function SidebarClientList({
  properties,
  locations,
}: {
  properties: Record<string, DatabaseProperty>;
  locations: Location[];
}) {
  const { filters } = useSidebarStore();
  const [groupBy, setGroupBy] = useState<string | null>(null);

  // Get all available filter options from database properties
  const allFilterOptions = Object.entries(properties)
    .filter(
      ([_, prop]) => prop.type === "select" || prop.type === "multi_select",
    )
    .map(([key, prop]) => ({
      name: key,
      type: prop.type,
      options:
        prop.type === "select"
          ? prop.select.options
          : prop.type === "multi_select"
            ? prop.multi_select.options
            : [],
    }));

  // If there are no filter options, just show the simple location list
  if (allFilterOptions.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {locations.map((location: Location) => (
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
        <Select
          value={groupBy ?? "none"}
          onValueChange={(value) => setGroupBy(value === "none" ? null : value)}
        >
          <SelectTrigger className="w-full">
            <Layers className="mr-2 h-4 w-4" />
            {groupBy ? (
              <span className="truncate">{groupBy}</span>
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

        <LocationList
          locations={locations}
          databaseProperties={properties}
          groupBy={groupBy}
        />
      </TabsContent>
      <TabsContent className="pr-2" value="filters">
        <SidebarFilterSort
          databaseProperties={properties}
          locations={locations}
        />
      </TabsContent>
    </Tabs>
  );
}
