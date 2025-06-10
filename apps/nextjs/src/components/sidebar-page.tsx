"use client";

import type { NotionNumberFormat } from "@/lib/format-number";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatNotionNumber } from "@/lib/format-number";
import { useMapStore } from "@/lib/map-store";
import { getNotionUrl } from "@/lib/types";
import { useTRPC } from "@/trpc/react";
import { Notion } from "@ridemountainpig/svgl-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { X } from "lucide-react";
import { NotionRenderer } from "react-notion-x";

import { cn, notionColourMap } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Separator } from "@acme/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useMultiSidebar,
} from "@acme/ui/sidebar";
import { Skeleton } from "@acme/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@acme/ui/table";

// Extend the Notion property type to include our relationTitle
type NotionPropertyValueWithRelation =
  PageObjectResponse["properties"][string] & {
    relationTitle?: string;
  };

interface PropertyWithName {
  id: string;
  name: string;
  value: NotionPropertyValueWithRelation;
  numberFormat?: NotionNumberFormat;
}

const PropertyValue = ({ property }: { property: PropertyWithName }) => {
  const value = property.value;

  switch (value.type) {
    case "rich_text":
      return (
        <span className="block w-[32ch] truncate">
          {value.rich_text[0]?.plain_text ?? ""}
        </span>
      );
    case "number":
      return (
        <span>{formatNotionNumber(value.number, property.numberFormat)}</span>
      );
    case "select":
      return value.select ? (
        <span
          className={cn(
            "inline-flex items-center rounded px-2 py-1 text-xs font-medium",
            notionColourMap[value.select.color].bg,
            notionColourMap[value.select.color].text,
          )}
        >
          {value.select.name}
        </span>
      ) : null;
    case "multi_select":
      return (
        <div className="flex flex-wrap gap-1">
          {value.multi_select.map((option) => (
            <span
              key={option.id}
              className={cn(
                "inline-flex items-center rounded px-2 py-1 text-xs font-medium",
                notionColourMap[option.color].bg,
                notionColourMap[option.color].text,
              )}
            >
              {option.name}
            </span>
          ))}
        </div>
      );
    case "date":
      return value.date ? (
        <>{format(new Date(value.date.start), "MMM d, yyyy")}</>
      ) : null;
    case "checkbox":
      return <span>{value.checkbox ? "Yes" : "No"}</span>;
    case "url":
      return value.url ? (
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-[32ch] truncate text-blue-500 hover:underline"
        >
          {value.url}
        </a>
      ) : null;
    case "email":
      return value.email ? (
        <a
          href={`mailto:${value.email}`}
          className="text-blue-500 hover:underline"
        >
          {value.email}
        </a>
      ) : null;
    case "phone_number":
      return <span>{value.phone_number ?? ""}</span>;
    case "created_time":
    case "last_edited_time": {
      const date =
        value.type === "created_time"
          ? value.created_time
          : value.last_edited_time;
      return <span>{format(new Date(date), "MMM d, yyyy h:mm a")}</span>;
    }
    case "relation":
      return (
        <span>
          {value.relation.map((relation) => (
            <span key={relation.id}>{value.relationTitle ?? relation.id}</span>
          ))}
        </span>
      );
    default:
      return <span>{"\u2014"}</span>;
  }
};

function PageSidebarSkeleton() {
  return (
    <>
      <SidebarHeader className="grid grid-cols-[1fr_auto] items-center gap-2 p-0 pr-4">
        <div className="flex flex-row items-center gap-2 p-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Button variant="outline" size="sm" className="w-full" disabled>
          <X className="h-4 w-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <div>
          <Table>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Separator className="mt-4" />
        <div className="prose prose-sm @md:prose-base space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-3/4" />
        </div>
      </SidebarContent>
    </>
  );
}

export function PageSidebar() {
  const { selectedMarkerId } = useMapStore();
  const { rightSidebar } = useMultiSidebar();
  const { toggleSidebar: toggleRightSidebar } = rightSidebar;
  const trpc = useTRPC();
  const { databaseId, userId } = useParams();

  // Use the correct state based on mobile vs desktop
  const rightSidebarOpen = rightSidebar.isMobile
    ? rightSidebar.openMobile
    : rightSidebar.open;

  const {
    data: page,
    isLoading,
    error,
  } = useQuery(
    trpc.page.getPage.queryOptions({ markerId: selectedMarkerId ?? "" }),
  );

  const { data: databaseProperties, isLoading: isDatabaseLoading } = useQuery({
    ...trpc.user.getDatabaseProperties.queryOptions({
      databaseId: databaseId as string,
      userId: userId as string,
    }),
    enabled: !!databaseId && !!userId,
  });

  React.useEffect(() => {
    if (!selectedMarkerId && rightSidebarOpen) {
      toggleRightSidebar();
    }
  }, [selectedMarkerId, rightSidebarOpen, toggleRightSidebar]);

  if (!selectedMarkerId) {
    return null;
  }

  return (
    <Sidebar
      variant="floating"
      className="@container bg-white pr-2"
      side="right"
    >
      {isLoading || isDatabaseLoading ? (
        <PageSidebarSkeleton />
      ) : error ? (
        <SidebarContent className="pr-2">
          <div>Error: {error.message}</div>
        </SidebarContent>
      ) : !page ? (
        <PageSidebarSkeleton />
      ) : (
        <>
          <SidebarHeader className="grid grid-cols-[1fr_auto] items-center gap-2 p-0 pr-4">
            <div className="flex flex-col items-start gap-2 p-4 @md:flex-row @md:items-center">
              <div>
                {page.icon && (
                  <div className="text-lg @md:text-2xl">{page.icon}</div>
                )}
              </div>
              <h2 className="text-base font-extrabold text-balance @sm:text-2xl">
                {page.title}
              </h2>
            </div>
            <Button
              onClick={() => toggleRightSidebar()}
              variant="ghost"
              size="icon"
              className="aspect-square w-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <div>
              <Table className="max-w-full">
                <TableBody>
                  {Object.entries(page.properties)
                    .filter(([key]) => !["Longitude", "Latitude"].includes(key))
                    .map(([key, prop]) => {
                      // Get the number format for this property if it exists
                      const dbProperty = databaseProperties?.[key];
                      const numberFormat =
                        dbProperty?.type === "number"
                          ? (dbProperty.number.format as NotionNumberFormat)
                          : undefined;

                      return (
                        <TableRow className="max-w-full" key={prop.id}>
                          <TableCell>{prop.TitleToUse}</TableCell>
                          <TableCell className="overflow-hidden">
                            <PropertyValue
                              property={{
                                id: prop.id,
                                name: key,
                                value: prop,
                                numberFormat,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            <div className="prose prose-sm @lg:prose-base">
              <Separator className="mb-3" />
              <NotionRenderer
                className="[&_.notion-hash-link_svg]:hidden [&_.notion-page-icon]:hidden [&_.notion-title]:hidden [&_header]:hidden"
                recordMap={page.recordMap}
                fullPage={true}
                darkMode={false}
              />
            </div>
          </SidebarContent>
          <SidebarFooter>
            <Button variant={"outline"} asChild className="w-full">
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={getNotionUrl(page.id)}
              >
                <Notion className="inline h-4 w-4" /> Edit in Notion
              </Link>
            </Button>
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
