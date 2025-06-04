import React, { createContext, useContext } from "react";
import { trpcClient } from "@/utils/api";
import { ClerkProvider, SignedIn } from "@clerk/chrome-extension";
import { DatabaseObjectResponse } from "@notionhq/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import Browser from "webextension-polyfill";

import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { Skeleton } from "@acme/ui/skeleton";

import { UpdateNotification } from "../../../components/UpdateNotification";
import { getSelectedDatabaseId } from "../helpers";

const PUBLISHABLE_KEY = import.meta.env.VITE_PUBLISHABLE_KEY;
const SYNC_HOST = import.meta.env.VITE_PUBLIC_CLERK_SYNC_HOST;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Please add the VITE_PUBLISHABLE_KEY to the .env.development file",
  );
}

if (!SYNC_HOST) {
  throw new Error(
    "Please add the VITE_CLERK_SYNC_HOST to the .env.development file",
  );
}

export const DataContext = createContext<{
  userDatabases: DatabaseObjectResponse[] | undefined;
  selectedDatabaseId: string | undefined;
  isLoading: boolean;
  error: Error | null;
}>({
  userDatabases: undefined,
  selectedDatabaseId: undefined,
  isLoading: false,
  error: null,
});

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error(
      "useDataContext must be used within a DataContext.Provider",
    );
  }
  return context;
}

async function fetchUserDatabases() {
  const data = await trpcClient.user.getUserDatabasesFromNotion.query();

  await Browser.storage.local.set({
    userDatabases: data,
    lastFetched: Date.now(),
  });

  return data;
}

const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: userDatabases,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userDatabases"],
    queryFn: fetchUserDatabases,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 1, // 1 hours
  });

  const { data: selectedDatabaseId } = useQuery({
    queryKey: ["selectedDatabaseId"],
    queryFn: getSelectedDatabaseId,
  });

  return (
    <DataContext.Provider
      value={{
        userDatabases,
        selectedDatabaseId,
        isLoading,
        error,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

function DatabaseSelect() {
  const { userDatabases, isLoading, error, selectedDatabaseId } =
    useDataContext();
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const selectedDatabase = userDatabases?.find(
    (db) => db.id === selectedDatabaseId,
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (isLoading || !userDatabases) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleSelect = async (db: DatabaseObjectResponse) => {
    setOpen(false);
    try {
      await Browser.storage.sync.set({
        notionDatabaseId: db.id,
      });
      queryClient.invalidateQueries({ queryKey: ["selectedDatabaseId"] });
    } catch (error) {
      console.error("Failed to save database ID:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedDatabase ? (
            <>
              {selectedDatabase.icon?.type === "emoji" && (
                <span className="mr-2">{selectedDatabase.icon.emoji}</span>
              )}
              {selectedDatabase.title[0]?.plain_text}
            </>
          ) : (
            <span className="text-muted-foreground">
              Select a database {userDatabases.length}
            </span>
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

export const RootLayout = () => {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      syncHost={SYNC_HOST}
    >
      <DataProvider>
        <div>
          <div className="p-2">
            <UpdateNotification />
          </div>
          <SignedIn>
            <div className="p-2">
              <DatabaseSelect />
            </div>
          </SignedIn>
          <main>
            <Outlet />
          </main>
        </div>
      </DataProvider>
    </ClerkProvider>
  );
};
