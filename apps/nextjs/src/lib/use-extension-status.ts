"use client";

import { useCallback, useEffect, useState } from "react";
import { useTRPC } from "@/trpc/react";
import { useQuery } from "@tanstack/react-query";

interface ExtensionStatus {
  isInstalled: boolean;
  versionNumber: string | null;
  isOutOfDate: boolean;
  isLoading?: boolean;
}

/**
 * Extract version number from git tag (removes 'extension-v' or 'v' prefix if present)
 */
function extractVersionFromTag(tagName: string): string {
  console.log("tagName: ", tagName);
  if (tagName.startsWith("extension-v")) {
    return tagName.slice("extension-v".length);
  }
  if (tagName.startsWith("v")) {
    return tagName.slice(1);
  }
  return tagName;
}

/**
 * Custom hook to detect browser extension installation and version status
 * Looks for the div with id "ExtensionInstalled" that the extension injects
 * Fetches current expected version from GitHub releases via TRPC
 */
export function useExtensionStatus(): ExtensionStatus {
  const trpc = useTRPC();
  const [status, setStatus] = useState<ExtensionStatus>({
    isInstalled: false,
    versionNumber: null,
    isOutOfDate: false,
    isLoading: true,
  });

  // Fetch latest release info
  const { data: latestRelease, isLoading: isLoadingRelease } = useQuery({
    ...trpc.releases.getLatestRelease.queryOptions(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  const checkExtensionStatus = useCallback(() => {
    const extensionDiv = document.getElementById("ExtensionInstalled");

    // Don't update status if we're still loading release info
    if (isLoadingRelease) {
      return;
    }

    if (!extensionDiv) {
      setStatus({
        isInstalled: false,
        versionNumber: null,
        isOutOfDate: false,
        isLoading: false,
      });
      return;
    }

    const versionNumber = extensionDiv.getAttribute("data-version");
    let isOutOfDate = false;

    // Compare with latest release version if available
    if (versionNumber && latestRelease?.tagName) {
      const currentVersion = extractVersionFromTag(latestRelease.tagName);
      console.log("currentVersion", currentVersion);
      isOutOfDate = compareVersions(versionNumber, currentVersion) < 0;
    }

    setStatus({
      isInstalled: true,
      versionNumber,
      isOutOfDate,
      isLoading: false,
    });
  }, [isLoadingRelease, latestRelease?.tagName]);

  useEffect(() => {
    // Check immediately
    checkExtensionStatus();

    // Set up a MutationObserver to watch for the div being added
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof Element) {
              if (
                node.id === "ExtensionInstalled" ||
                node.querySelector("#ExtensionInstalled")
              ) {
                checkExtensionStatus();
                return;
              }
            }
          }
        }
      }
    });

    // Observe changes to the document body and head
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also check periodically for the first 10 seconds in case the div is added later
    let pollCount = 0;
    const maxPolls = 10; // Stop after 10 seconds

    const interval = setInterval(() => {
      checkExtensionStatus();
      pollCount++;

      if (pollCount >= maxPolls) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [checkExtensionStatus]);

  return status;
}

/**
 * Compare two semantic version strings
 * Returns: -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split(".").map(Number);
  const v2parts = version2.split(".").map(Number);

  const maxLength = Math.max(v1parts.length, v2parts.length);

  for (let i = 0; i < maxLength; i++) {
    const v1part = v1parts[i] ?? 0;
    const v2part = v2parts[i] ?? 0;

    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }

  return 0;
}
