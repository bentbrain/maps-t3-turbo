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
  dismissedAt?: number; // Timestamp when dismissed
  updateInfo?: UpdateInfo;
}

const CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
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

  // Store the update info, preserving existing dismissal state
  const existingStored = await getStoredUpdateInfo();
  const storedInfo: StoredUpdateInfo = {
    lastChecked: Date.now(),
    updateInfo,
    // Preserve existing dismissal state
    dismissedVersion: existingStored?.dismissedVersion,
    dismissedAt: existingStored?.dismissedAt,
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
  // First check if we have stored data and if it's been dismissed recently
  const stored = await getStoredUpdateInfo();

  // Check if we need to fetch new data (no stored data or data is old)
  const shouldFetch =
    !stored || Date.now() - stored.lastChecked > CHECK_INTERVAL;

  let updateInfo: UpdateInfo | null;

  if (shouldFetch) {
    updateInfo = await checkForUpdates();
  } else {
    updateInfo = stored.updateInfo || null;
  }

  if (!updateInfo?.hasUpdate) {
    return null;
  }

  // Check if user dismissed this version recently (within 24 hours)
  const currentStored = shouldFetch ? await getStoredUpdateInfo() : stored;
  if (
    currentStored?.dismissedVersion === updateInfo.latestVersion &&
    currentStored?.dismissedAt
  ) {
    const timeSinceDismiss = Date.now() - currentStored.dismissedAt;
    if (timeSinceDismiss < DISMISS_DURATION) {
      return null;
    }
  }

  return updateInfo;
}

// Dismiss update notification for current version (24 hour cooldown)
export async function dismissUpdateNotification(
  version: string,
): Promise<void> {
  const stored = await getStoredUpdateInfo();
  const updatedInfo: StoredUpdateInfo = {
    lastChecked: stored?.lastChecked || Date.now(),
    updateInfo: stored?.updateInfo,
    dismissedVersion: version,
    dismissedAt: Date.now(), // Store when it was dismissed
  };

  await Browser.storage.local.set({ [STORAGE_KEY]: updatedInfo });
}

// Force check for updates (for manual refresh)
export async function forceCheckForUpdates(): Promise<UpdateInfo | null> {
  return await checkForUpdates();
}
