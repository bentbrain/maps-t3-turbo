import { TRPCReactProvider } from "@/utils/react";
import { useQuery } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import Browser from "webextension-polyfill";

import { AuthGuard } from "./components/auth-guard";
import { RootLayout } from "./layouts/root-layout";
import LocationForm from "./location-form";
import { SignInPage } from "./routes/signin";

async function getCurrentTab() {
  const [tab] = await Browser.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function Router() {
  const { data: currentTab } = useQuery({
    queryKey: ["currentTab"],
    queryFn: getCurrentTab,
  });

  const url = currentTab?.url ? new URL(currentTab.url) : null;

  const router = createMemoryRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: (
            <AuthGuard>
              <LocationForm />
            </AuthGuard>
          ),
        },
        {
          path: "signin",
          element: (
            <AuthGuard>
              <SignInPage />
            </AuthGuard>
          ),
        },
        // Add location form route only for Google Maps
        ...(url?.hostname.includes("google.com") &&
        url?.pathname.includes("/maps")
          ? [
              {
                path: "location",
                element: (
                  <AuthGuard>
                    <LocationForm />
                  </AuthGuard>
                ),
              },
            ]
          : []),
      ],
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
