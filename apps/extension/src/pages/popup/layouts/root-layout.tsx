import React, { createContext, useContext } from "react";
import { trpcClient } from "@/utils/api";
import { ClerkProvider, useUser } from "@clerk/chrome-extension";
import { DatabaseObjectResponse } from "@notionhq/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useNavigate } from "react-router";
import Browser from "webextension-polyfill";

import { Skeleton } from "@acme/ui/skeleton";

import { DatabaseSelect } from "../../../components/DatabaseSelect";
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

function DatabaseSelectWrapper() {
  const { isSignedIn } = useUser();
  const { isLoading, error, selectedDatabaseId } = useDataContext();
  const queryClient = useQueryClient();

  // Don't render anything if user is not signed in
  if (!isSignedIn) {
    return null;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const handleChange = async (value: string) => {
    try {
      await Browser.storage.sync.set({
        notionDatabaseId: value,
      });
      queryClient.invalidateQueries({ queryKey: ["selectedDatabaseId"] });
    } catch (error) {
      console.error("Failed to save database ID:", error);
    }
  };

  return <DatabaseSelect value={selectedDatabaseId} onChange={handleChange} />;
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
          <div className="p-2">
            <DatabaseSelectWrapper />
          </div>
          <main>
            <Outlet />
          </main>
        </div>
      </DataProvider>
    </ClerkProvider>
  );
};
