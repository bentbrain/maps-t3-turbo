import { Suspense } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";

import { SidebarClientList } from "./sidebar-client-list";
import { SidebarButtonWrapper } from "./sidebar-dynamic-wrapper";
import { SidebarUserLocation } from "./sidebar-user-location";

export function AppSidebar() {
  return (
    <Sidebar
      className="group-has-[.disable-layout-features]/root:hidden!"
      side="left"
    >
      <SidebarHeader>
        <SidebarUserLocation />
      </SidebarHeader>
      <SidebarContent className="stable-gutter">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <SidebarClientList />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <Suspense
          fallback={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <SidebarButtonWrapper />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
