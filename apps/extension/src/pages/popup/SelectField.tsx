import { useState } from "react";
import { Check } from "lucide-react";

import { cn, notionColourMap } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@acme/ui/command";

interface SelectOption {
  id: string;
  name: string;
  color?: string;
}

interface SelectFieldProps {
  options: SelectOption[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  isMulti?: boolean;
  disabled?: boolean;
}

export function SelectField({
  options,
  selected,
  onChange,
  isMulti = false,
  disabled = false,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedArray = Array.isArray(selected) ? selected : [selected];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="flex h-auto w-full flex-wrap justify-start p-2"
          disabled={disabled}
        >
          {selectedArray.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              {selectedArray.map((value) => {
                const option = options.find((opt) => opt.name === value);
                return (
                  <Badge
                    key={value}
                    className={cn(
                      notionColourMap[
                        option?.color as keyof typeof notionColourMap
                      ]?.bg,
                      notionColourMap[
                        option?.color as keyof typeof notionColourMap
                      ]?.text,
                    )}
                  >
                    <span className="max-w-[25ch] truncate">{value}</span>
                  </Badge>
                );
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">Select...</span>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search options..." className="h-9" />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {options.map((option) => {
              const isSelected = selectedArray.includes(option.name);
              return (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    if (isMulti) {
                      onChange(
                        isSelected
                          ? (selected as string[]).filter(
                              (name) => name !== option.name,
                            )
                          : [...(selected as string[]), option.name],
                      );
                    } else {
                      onChange(option.name);
                      setOpen(false);
                    }
                  }}
                  disabled={disabled}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Badge
                    className={cn(
                      notionColourMap[
                        option.color as keyof typeof notionColourMap
                      ]?.text,
                      notionColourMap[
                        option.color as keyof typeof notionColourMap
                      ]?.bg,
                      isSelected && "ring-foreground ring-1",
                    )}
                  >
                    <span className="max-w-[25ch] truncate">{option.name}</span>
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </CollapsibleContent>
    </Collapsible>
  );
}
