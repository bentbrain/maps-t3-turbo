import type { Location } from "@/lib/get-initial-data";
import { useSidebarStore } from "@/lib/sidebar-store";
import { CircleMinus, Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@acme/ui/sidebar";
import { Switch } from "@acme/ui/switch";

interface SidebarFilterSortProps {
  locations: Location[];
  isLoading?: boolean;
}

export function SidebarFilterSort({
  locations,
  isLoading,
}: SidebarFilterSortProps) {
  const {
    filters,
    updateFilter,
    removeFilter,
    clearFilters,
    databaseProperties,
  } = useSidebarStore();

  if (locations.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      </div>
    );
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
          ? prop.select.options
          : prop.type === "multi_select"
            ? prop.multi_select.options
            : [],
    }));

  if (allFilterOptions.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        No filter options available
      </div>
    );
  }

  return (
    <>
      {allFilterOptions.map((filterOption) => {
        const currentFilter = filters.find(
          (f) => f.property === filterOption.name,
        );
        const includedValues = currentFilter?.values ?? [];

        // Get the property definition
        const property = databaseProperties[filterOption.name];
        if (!property) return null;

        // Get all available options for this property
        const allOptionValues =
          property.type === "select"
            ? property.select.options
            : property.type === "multi_select"
              ? property.multi_select.options
              : [];

        const allSelected = includedValues.length === allOptionValues.length;

        return (
          <SidebarGroup key={filterOption.name}>
            {/* Group Header with Toggle All */}
            <SidebarGroupLabel className="flex w-full items-center justify-between gap-2 pr-0">
              <span className="w-full truncate">{filterOption.name}</span>
              <Switch
                className="data-[state=checked]:bg-lime-800"
                checked={allSelected}
                onCheckedChange={(checked: boolean) => {
                  if (checked) {
                    // Include all values
                    updateFilter(
                      filterOption.name,
                      allOptionValues.map((v) => v.name),
                    );
                  } else {
                    // Include no values
                    removeFilter(filterOption.name);
                  }
                }}
              />
            </SidebarGroupLabel>

            {/* Filter Options */}
            <SidebarGroupContent className="space-y-2 pl-2">
              <SidebarMenu className="space-y-1">
                {allOptionValues.map((option) => {
                  const isSelected = includedValues.includes(option.name);
                  return (
                    <SidebarMenuItem
                      key={option.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-sm">{option.name}</span>
                      <Switch
                        checked={isSelected}
                        className="data-[state=checked]:bg-lime-500"
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            // Include by adding to included values
                            updateFilter(filterOption.name, [
                              ...includedValues,
                              option.name,
                            ]);
                          } else {
                            // Exclude by removing from included values
                            const newIncludedValues = includedValues.filter(
                              (v) => v !== option.name,
                            );
                            if (newIncludedValues.length === 0) {
                              removeFilter(filterOption.name);
                            } else {
                              updateFilter(
                                filterOption.name,
                                newIncludedValues,
                              );
                            }
                          }
                        }}
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}

      {filters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full"
          onClick={clearFilters}
        >
          <CircleMinus className="h-4 w-4" /> Clear all filters
        </Button>
      )}
    </>
  );
}
