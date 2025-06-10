import type { DatabaseProperty } from "@/lib/map-store";
import type { Location } from "@/lib/types";
import { useCallback, useState } from "react";
import { useMapStore } from "@/lib/map-store";
import { CircleMinus, Loader2, Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
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
  databaseProperties: Record<string, DatabaseProperty>;
  isLoading?: boolean;
}

export function SidebarFilterSort({
  locations,
  databaseProperties,
  isLoading,
}: SidebarFilterSortProps) {
  const {
    filters,
    updateFilter,
    updateNumberFilter,
    removeFilter,
    clearFilters,
  } = useMapStore();

  // State for new filter being created
  const [newFilterProperty, setNewFilterProperty] = useState<string | null>(
    null,
  );
  const [newFilterOperator, setNewFilterOperator] = useState<"gt" | "lt">("gt");
  const [newFilterValue, setNewFilterValue] = useState<string>("");

  // Generate a unique ID for each filter
  const handleAddFilter = useCallback(() => {
    if (newFilterProperty && newFilterValue) {
      const value = parseFloat(newFilterValue);
      if (!isNaN(value)) {
        // Add a timestamp to make each filter unique
        const uniqueProperty = `${newFilterProperty}_${Date.now()}`;
        updateNumberFilter(uniqueProperty, newFilterOperator, value);
        // Reset form
        setNewFilterProperty(null);
        setNewFilterOperator("gt");
        setNewFilterValue("");
      }
    }
  }, [
    newFilterProperty,
    newFilterValue,
    newFilterOperator,
    updateNumberFilter,
  ]);

  // Memoize filter handlers to prevent excessive re-renders
  const handleSelectAllToggle = useCallback(
    (filterName: string, allOptions: { name: string }[], checked: boolean) => {
      if (checked) {
        // Include all values
        updateFilter(
          filterName,
          allOptions.map((v) => v.name),
        );
      } else {
        // Include no values
        removeFilter(filterName);
      }
    },
    [updateFilter, removeFilter],
  );

  const handleIndividualToggle = useCallback(
    (
      filterName: string,
      optionName: string,
      includedValues: string[],
      checked: boolean,
    ) => {
      if (checked) {
        // Include by adding to included values
        updateFilter(filterName, [...includedValues, optionName]);
      } else {
        // Exclude by removing from included values
        const newIncludedValues = includedValues.filter(
          (v) => v !== optionName,
        );
        if (newIncludedValues.length === 0) {
          removeFilter(filterName);
        } else {
          updateFilter(filterName, newIncludedValues);
        }
      }
    },
    [updateFilter, removeFilter],
  );

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

  // Get all available number properties
  const numberProperties = Object.entries(databaseProperties)
    .filter(
      ([key, prop]) =>
        !["Latitude", "Longitude"].includes(key) && prop.type === "number",
    )
    .map(([key]) => key);

  // Get all available filter options from database properties for non-number types
  const selectFilterOptions = Object.entries(databaseProperties)
    .filter(
      ([key, prop]) =>
        !["Latitude", "Longitude"].includes(key) &&
        (prop.type === "select" || prop.type === "multi_select"),
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

  if (numberProperties.length === 0 && selectFilterOptions.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        No filter options available
      </div>
    );
  }

  // Get current number filters
  const numberFilters = filters.filter((f) => f.type === "number");

  // Group filters by property for display
  const groupedFilters = numberFilters.reduce(
    (acc, filter) => {
      // Remove timestamp from property name for display
      const baseProperty = filter.property.split("_")[0] ?? filter.property;
      if (baseProperty) {
        acc[baseProperty] ??= [];
        if (Array.isArray(acc[baseProperty])) {
          acc[baseProperty].push(filter);
        }
      }
      return acc;
    },
    {} as Record<string, typeof numberFilters>,
  );

  return (
    <>
      {selectFilterOptions.map((filterOption) => {
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
            <SidebarGroupLabel className="flex w-full items-center justify-between gap-2 pr-0">
              <span className="w-full truncate">{filterOption.name}</span>
              <Switch
                className="data-[state=checked]:bg-lime-800"
                checked={allSelected}
                onCheckedChange={(checked: boolean) => {
                  handleSelectAllToggle(
                    filterOption.name,
                    allOptionValues,
                    checked,
                  );
                }}
              />
            </SidebarGroupLabel>

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
                          handleIndividualToggle(
                            filterOption.name,
                            option.name,
                            includedValues,
                            checked,
                          );
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

      {numberProperties.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Number Filtering</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4">
            {Object.entries(groupedFilters).map(
              ([property, propertyFilters]) => (
                <div key={property} className="space-y-2">
                  {propertyFilters.map((filter) => (
                    <div
                      key={filter.property}
                      className="flex items-center justify-between gap-2 rounded-md border p-2"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{property}</p>
                        <div className="text-muted-foreground flex-1 text-xs">
                          {filter.operator === "gt"
                            ? "Greater than"
                            : "Less than"}{" "}
                          {filter.value}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.property)}
                      >
                        <CircleMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ),
            )}

            <div className="space-y-3 rounded-md border p-3">
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <Select
                  value={newFilterProperty ?? ""}
                  onValueChange={setNewFilterProperty}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {numberProperties.map((prop) => (
                      <SelectItem key={prop} value={prop}>
                        {prop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newFilterOperator}
                  onValueChange={(value: "gt" | "lt") =>
                    setNewFilterOperator(value)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="px-3 font-mono text-xs"
                    showArrow={false}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gt">&gt;</SelectItem>
                    <SelectItem value="lt">&lt;</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                value={newFilterValue}
                onChange={(e) => setNewFilterValue(e.target.value)}
                placeholder="Enter value..."
                className="text-base"
              />

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={!newFilterProperty || !newFilterValue}
                onClick={handleAddFilter}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Filter
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

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
