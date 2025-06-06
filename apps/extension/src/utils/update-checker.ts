import Browser from "webextension-polyfill";

import { trpcClient } from "./api";

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

interface StoredUpdateInfo {
  lastChecked: number;
  dismissedVersion?: string;
  updateInfo?: UpdateInfo;
}

const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const STORAGE_KEY = "extensionUpdateInfo";

// Get current extension version from manifest
function getCurrentVersion(): string {
  const manifest = Browser.runtime.getManifest();
  return manifest.version;
}

// Compare semantic versions
function isVersionNewer(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

// Fetch latest extension release via TRPC
async function fetchLatestExtensionRelease() {
  try {
    const release = await trpcClient.releases.getLatestRelease.query();

    if (!release) {
      return null;
    }

    return {
      tagName: release.tagName,
      name: release.name || "",
      publishedAt: release.publishedAt || "",
      htmlUrl: release.htmlUrl,
      body: release.body || "",
    };
  } catch (error) {
    console.warn("Error fetching latest extension release:", error);
    return null;
  }
}

// Check for updates
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  const currentVersion = getCurrentVersion();
  const latestRelease = await fetchLatestExtensionRelease();

  if (!latestRelease) {
    return null;
  }

  // Extract version from tag (e.g., "extension-v1.4.1" -> "1.4.1")
  const latestVersion = latestRelease.tagName.replace("extension-v", "");
  const hasUpdate = isVersionNewer(currentVersion, latestVersion);

  const updateInfo: UpdateInfo = {
    hasUpdate,
    latestVersion,
    currentVersion,
    releaseUrl: latestRelease.htmlUrl,
    releaseNotes: latestRelease.body,
    publishedAt: latestRelease.publishedAt,
  };

  // Store the update info
  const storedInfo: StoredUpdateInfo = {
    lastChecked: Date.now(),
    updateInfo,
  };

  await Browser.storage.local.set({ [STORAGE_KEY]: storedInfo });

  return updateInfo;
}

// Get stored update info
export async function getStoredUpdateInfo(): Promise<StoredUpdateInfo | null> {
  const result = await Browser.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];

  if (
    !stored ||
    typeof stored !== "object" ||
    typeof (stored as any).lastChecked !== "number"
  ) {
    return null;
  }

  return stored as StoredUpdateInfo;
}

// Check if we should show the update notification
export async function shouldShowUpdateNotification(): Promise<UpdateInfo | null> {
  const stored = await getStoredUpdateInfo();

  // Check if we need to fetch new data
  const shouldFetch =
    !stored || Date.now() - stored.lastChecked > CHECK_INTERVAL;

  if (shouldFetch) {
    const updateInfo = await checkForUpdates();
    if (!updateInfo?.hasUpdate) return null;

    // Don't show if user dismissed this version
    if (stored?.dismissedVersion === updateInfo.latestVersion) {
      return null;
    }

    return updateInfo;
  }

  // Use stored data
  if (!stored.updateInfo?.hasUpdate) return null;

  // Don't show if user dismissed this version
  if (stored.dismissedVersion === stored.updateInfo.latestVersion) {
    return null;
  }

  return stored.updateInfo;
}

// Dismiss update notification for current version
export async function dismissUpdateNotification(
  version: string,
): Promise<void> {
  const stored = await getStoredUpdateInfo();
  const updatedInfo: StoredUpdateInfo = {
    lastChecked: stored?.lastChecked || Date.now(),
    updateInfo: stored?.updateInfo,
    dismissedVersion: version,
  };

  await Browser.storage.local.set({ [STORAGE_KEY]: updatedInfo });
}

// Force check for updates (for manual refresh)
export async function forceCheckForUpdates(): Promise<UpdateInfo | null> {
  return await checkForUpdates();
}
