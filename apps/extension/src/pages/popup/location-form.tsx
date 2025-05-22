import { useEffect, useMemo, useState } from "react";
import { useTRPC } from "@/utils/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, LoaderCircle, X } from "lucide-react";
import { useForm } from "react-hook-form";
import Browser from "webextension-polyfill";

import type { DynamicFormData } from "@acme/validators/new-place-schema";
import { cn, notionColourMap } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/collapsible";
import { EmojiPicker } from "@acme/ui/emoji-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { createDynamicFormSchema } from "@acme/validators/new-place-schema";

import { getSelectedDatabaseId } from "./helpers";
import { useDataContext } from "./layouts/root-layout";

interface LocationData {
  title: string;
  address: string;
  longitude: string;
  latitude: string;
  emoji?: string;
  [key: string]: string | string[] | undefined;
}

async function fetchLocationData(): Promise<LocationData> {
  try {
    const [tab] = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url?.includes("google.com/maps")) {
      throw new Error("Please open this extension on Google Maps");
    }

    if (!tab.id) {
      throw new Error("Could not find active tab");
    }

    const response = (await Browser.tabs.sendMessage(tab.id, {
      action: "getLocationData",
    })) as LocationData;

    if (!response) {
      throw new Error("No location data received");
    }

    return response;
  } catch (error) {
    console.error("Error getting location data:", error);
    throw error;
  }
}

export default function LocationForm() {
  const { userDatabases, isLoading, error } = useDataContext();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const trpc = useTRPC();

  const createUserMutation = useMutation(
    trpc.user.addPlaceToNotion.mutationOptions(),
  );

  const { data: selectedDatabaseId } = useQuery({
    queryKey: ["selectedDatabaseId"],
    queryFn: getSelectedDatabaseId,
  });

  const selectedDatabase = userDatabases?.find(
    (db) => db.id === selectedDatabaseId,
  );

  // Create dynamic form schema
  const formSchema = useMemo(() => {
    return selectedDatabase
      ? createDynamicFormSchema(selectedDatabase.properties)
      : createDynamicFormSchema({});
  }, [selectedDatabase]);

  // Create form with dynamic schema
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      address: "",
      longitude: "",
      latitude: "",
      emoji: "📍",
    },
  });

  // Query for location data
  const {
    data: locationData,
    error: locationError,
    isLoading: isLocationLoading,
  } = useQuery({
    queryKey: ["locationData"],
    queryFn: fetchLocationData,
    retry: 2,
    retryDelay: 1000,
  });

  // Update form when location data changes
  useEffect(() => {
    if (locationData) {
      const formData: DynamicFormData = {
        title: locationData.title || "",
        address: locationData.address || "",
        longitude: locationData.longitude || "",
        latitude: locationData.latitude || "",
        emoji: "📍",
      };

      // Add dynamic fields
      Object.entries(locationData).forEach(([key, value]) => {
        if (
          key !== "title" &&
          key !== "address" &&
          key !== "longitude" &&
          key !== "latitude" &&
          key !== "emoji"
        ) {
          formData[key.toLowerCase()] = value;
        }
      });

      form.reset(formData);
    }
  }, [locationData, form]);

  if (!selectedDatabaseId) {
    return (
      <div className="flex items-center justify-center">
        <p>No database selected</p>
      </div>
    );
  }

  // Handle form submission
  const onSubmit = (values: any) => {
    createUserMutation.mutate(
      {
        databaseId: selectedDatabaseId,
        formData: values,
      },
      {
        onSuccess: (data) => {
          setSuccessUrl(data.pageUrl);
        },
        onError: (error) => {
          console.error("Error saving location:", error);
        },
      },
    );
  };

  // Handle errors
  useEffect(() => {
    if (locationError) {
      console.error("Location error:", locationError);
      form.setError("root", {
        message:
          locationError instanceof Error
            ? locationError.message
            : "Failed to fetch location data",
      });
    }
  }, [locationError, form]);

  if (successUrl) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="rounded-full bg-green-100 p-3">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-center text-xl font-semibold">Location Saved!</h2>
          <p className="text-muted-foreground text-center">
            Your location has been successfully added to Notion
          </p>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <a href={successUrl} target="_blank" rel="noopener noreferrer">
              View in Notion
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSuccessUrl(null);
              form.reset();
            }}
          >
            Add Another Location
          </Button>
        </div>
      </div>
    );
  }

  if (isLocationLoading) {
    return (
      <div className="flex items-center justify-center">
        <LoaderCircle className="text-muted-foreground h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!selectedDatabase) {
    return (
      <div className="flex items-center justify-center">
        <p>No database selected</p>
      </div>
    );
  }

  console.log("errors: ", form.formState.errors);

  return (
    <div className="p-4">
      {form.formState.errors.root && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
          {form.formState.errors.root.message}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <Collapsible open={emojiOpen} onOpenChange={setEmojiOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="size-9"
                          disabled={isLocationLoading}
                        >
                          {isLocationLoading ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>{field.value}</span>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="absolute top-4 right-0 bottom-4 left-4">
                        <EmojiPicker
                          className="h-full w-full shadow [&_[tabindex='0']]:!h-full"
                          emojisPerRow={8}
                          onEmojiSelect={(emoji: string) => {
                            field.onChange(emoji);
                            setEmojiOpen(false);
                          }}
                        >
                          <EmojiPicker.Header>
                            <EmojiPicker.Input placeholder="Search emoji" />
                            <Button
                              onClick={() => setEmojiOpen(false)}
                              variant="outline"
                              size="icon"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </EmojiPicker.Header>
                          <EmojiPicker.Group className="h-full">
                            <EmojiPicker.List />
                          </EmojiPicker.Group>
                        </EmojiPicker>
                      </CollapsibleContent>
                    </Collapsible>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocationLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLocationLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="hidden gap-4">
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocationLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLocationLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dynamically render select/multi-select fields */}
          {Object.entries(selectedDatabase?.properties ?? {})
            .filter(([key, prop]) => key !== "Longitude" && key !== "Latitude")
            .map(([key, prop]) => {
              if (prop.type === "multi_select") {
                return (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key.toLowerCase()}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{key}</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex h-auto w-full flex-wrap justify-start p-2"
                                disabled={isLocationLoading}
                              >
                                {Array.isArray(field.value) &&
                                field.value.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {field.value.map((tag: string) => {
                                      const tagOption =
                                        prop.multi_select.options?.find(
                                          (opt) => opt.name === tag,
                                        );
                                      return (
                                        <Badge
                                          key={tag}
                                          className={cn(
                                            notionColourMap[
                                              tagOption?.color as keyof typeof notionColourMap
                                            ]?.bg,
                                            notionColourMap[
                                              tagOption?.color as keyof typeof notionColourMap
                                            ]?.text,
                                          )}
                                        >
                                          <span className="max-w-[25ch] truncate">
                                            {tag}
                                          </span>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Select tags...
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <div className="flex max-h-60 flex-col gap-2 overflow-auto">
                                {prop.multi_select.options?.map((option) => {
                                  const isChecked =
                                    Array.isArray(field.value) &&
                                    field.value.includes(option.name);
                                  return (
                                    <label
                                      key={option.id}
                                      className="flex cursor-pointer items-center gap-2 px-2"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        className="hidden"
                                        onChange={() => {
                                          if (isChecked) {
                                            field.onChange(
                                              field.value.filter(
                                                (name: string) =>
                                                  name !== option.name,
                                              ),
                                            );
                                          } else {
                                            field.onChange([
                                              ...(field.value || []),
                                              option.name,
                                            ]);
                                          }
                                        }}
                                        disabled={isLocationLoading}
                                      />
                                      <Badge
                                        className={cn(
                                          notionColourMap[
                                            option.color as keyof typeof notionColourMap
                                          ]?.text,
                                          notionColourMap[
                                            option.color as keyof typeof notionColourMap
                                          ]?.bg,
                                          notionColourMap[
                                            option.color as keyof typeof notionColourMap
                                          ]?.ring,
                                          isChecked && "ring-2",
                                        )}
                                      >
                                        <span className="max-w-[25ch] truncate">
                                          {option.name}
                                        </span>
                                      </Badge>
                                    </label>
                                  );
                                })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              }
              if (prop.type === "select") {
                console.log("select prop: ", prop);
                return (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key.toLowerCase()}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{key}</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex h-auto w-full flex-wrap justify-start p-2"
                                disabled={isLocationLoading}
                              >
                                {field.value ? (
                                  <Badge
                                    className={cn(
                                      notionColourMap[
                                        prop.select.options?.find(
                                          (opt) => opt.name === field.value,
                                        )?.color as keyof typeof notionColourMap
                                      ]?.bg,
                                      notionColourMap[
                                        prop.select.options?.find(
                                          (opt) => opt.name === field.value,
                                        )?.color as keyof typeof notionColourMap
                                      ]?.text,
                                    )}
                                  >
                                    <span className="max-w-[25ch] truncate">
                                      {field.value}
                                    </span>
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Select...
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72">
                              <div className="flex max-h-60 flex-col gap-2 overflow-auto py-2">
                                {/* Add a "Clear" option at the top */}
                                <label
                                  className="flex cursor-pointer items-center gap-2 px-2"
                                  onClick={() => field.onChange(undefined)}
                                >
                                  <Badge
                                    className={cn(
                                      "bg-gray-200 text-gray-700",
                                      !field.value && "ring-2",
                                    )}
                                  >
                                    <span className="max-w-[25ch] truncate">
                                      None
                                    </span>
                                  </Badge>
                                </label>
                                {/* Render the rest of the options */}
                                {prop.select.options?.map((option) => (
                                  <label
                                    key={option.id}
                                    className="flex cursor-pointer items-center gap-2 px-2"
                                    onClick={() => field.onChange(option.name)}
                                  >
                                    <Badge
                                      className={cn(
                                        notionColourMap[
                                          option.color as keyof typeof notionColourMap
                                        ]?.text,
                                        notionColourMap[
                                          option.color as keyof typeof notionColourMap
                                        ]?.bg,
                                        notionColourMap[
                                          option.color as keyof typeof notionColourMap
                                        ]?.ring,
                                        field.value === option.name && "ring-2",
                                      )}
                                    >
                                      <span className="max-w-[25ch] truncate">
                                        {option.name}
                                      </span>
                                    </Badge>
                                  </label>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              }
              if (prop.type === "number") {
                return (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key.toLowerCase()}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{key}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled={isLocationLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              }
              return null;
            })}
          <Button
            type="submit"
            className="w-full"
            disabled={createUserMutation.isPending || isLocationLoading}
          >
            {createUserMutation.isPending ? (
              <div className="flex items-center gap-2">
                <span>Saving...</span>
                <LoaderCircle className="h-4 w-4 animate-spin" />
              </div>
            ) : isLocationLoading ? (
              <div className="flex items-center gap-2">
                <span>Loading...</span>
                <LoaderCircle className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              "Save Location"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
