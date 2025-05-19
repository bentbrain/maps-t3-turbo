import { TRPCReactProvider } from "@/utils/react";
import { useQuery } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import Browser from "webextension-polyfill";

import { RootLayout } from "./layouts/root-layout";
import LocationForm from "./location-form";
import { Home } from "./routes/home";

async function getCurrentTab() {
  const [tab] = await Browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function useRoutes() {
  const { data: currentTab } = useQuery({
    queryKey: ["currentTab"],
    queryFn: getCurrentTab,
  });

  const url = currentTab?.url ? new URL(currentTab.url) : null;

  // Base routes that are always available
  const baseRoutes = [{ path: "/", element: <Home /> }];

  // Add location form route only for Google Maps
  if (url?.hostname.includes("google.com") && url?.pathname.includes("/maps")) {
    baseRoutes.push({ path: "/location", element: <LocationForm /> });
  }

  // Add other website-specific routes here
  // Example:
  // if (url?.hostname.includes("notion.so")) {
  //   baseRoutes.push({ path: "/notion", element: <NotionView /> });
  // }

  return baseRoutes;
}

function Router() {
  const routes = useRoutes();

  const router = createMemoryRouter([
    {
      element: <RootLayout />,
      children: routes,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default function PopupIndex() {
  return (
    <TRPCReactProvider>
      <Router />
    </TRPCReactProvider>
  );
}
