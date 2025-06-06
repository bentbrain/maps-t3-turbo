import { useState } from "react";
import { trpcClient } from "@/utils/api";
import { useUser } from "@clerk/chrome-extension";
import { DatabaseObjectResponse } from "@notionhq/client";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import Browser from "webextension-polyfill";

import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { Skeleton } from "@acme/ui/skeleton";

async function fetchUserDatabases() {
  const data = await trpcClient.user.getUserDatabasesFromNotion.query();

  await Browser.storage.local.set({
    userDatabases: data,
    lastFetched: Date.now(),
  });

  return data;
}

interface DatabaseSelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DatabaseSelect({
  value,
  onChange,
  disabled,
  placeholder = "Select a database",
}: DatabaseSelectProps) {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);

  const {
    data: userDatabases,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userDatabases"],
    queryFn: fetchUserDatabases,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 1, // 1 hours
    enabled: isSignedIn,
  });

  const selectedDatabase = userDatabases?.find((db) => db.id === value);

  // Don't render anything if user is not signed in
  if (!isSignedIn) {
    return (
      <div className="text-muted-foreground text-sm">
        Please sign in to select a database
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">Error: {error.message}</div>
    );
  }

  if (isLoading || !userDatabases) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleSelect = (db: DatabaseObjectResponse) => {
    setOpen(false);
    onChange(db.id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={disabled}
        >
          {selectedDatabase ? (
            <>
              {selectedDatabase.icon?.type === "emoji" && (
                <span className="mr-2">{selectedDatabase.icon.emoji}</span>
              )}
              {selectedDatabase.title[0]?.plain_text}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <div className="flex flex-col">
          {userDatabases.map((database) => {
            return (
              <Button
                key={database.id}
                variant="ghost"
                className="w-full justify-start px-4 py-2"
                onClick={() => handleSelect(database)}
              >
                {database.icon?.type === "emoji" && (
                  <span className="mr-2">{database.icon.emoji}</span>
                )}
                <span className="flex-1 text-left">
                  {database.title[0]?.plain_text}
                </span>
                {selectedDatabase?.id === database.id && (
                  <Check className="text-primary ml-2 h-4 w-4" />
                )}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
