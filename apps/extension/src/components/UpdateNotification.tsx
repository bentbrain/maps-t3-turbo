import React, { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";

import type { UpdateInfo } from "../utils/update-checker";
import {
  dismissUpdateNotification,
  shouldShowUpdateNotification,
} from "../utils/update-checker";

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({
  className = "",
}: UpdateNotificationProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await shouldShowUpdateNotification();
      if (update) {
        setUpdateInfo(update);
        setIsVisible(true);
      }
    } catch (error) {
      console.warn("Failed to check for updates:", error);
    }
  };

  const handleDismiss = async () => {
    if (!updateInfo) return;

    setIsDismissing(true);
    try {
      await dismissUpdateNotification(updateInfo.latestVersion);
      setIsVisible(false);
    } catch (error) {
      console.warn("Failed to dismiss update notification:", error);
    } finally {
      setIsDismissing(false);
    }
  };

  const handleViewRelease = () => {
    if (updateInfo?.releaseUrl) {
      chrome.tabs.create({ url: updateInfo.releaseUrl });
    }
  };

  if (!isVisible || !updateInfo) {
    return null;
  }

  return (
    <div
      className={`mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start space-x-2">
          <Download className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-blue-900">
              Update Available
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Version {updateInfo.latestVersion} is now available
            </p>
            {updateInfo.releaseNotes && (
              <p className="mt-1 line-clamp-2 text-xs text-blue-600">
                {updateInfo.releaseNotes.split("\n")[0].replace(/^#+\s*/, "")}
              </p>
            )}
          </div>
        </div>
        <div className="ml-2 flex items-center space-x-1">
          <button
            onClick={handleViewRelease}
            className="rounded p-1 text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
            title="View release"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="rounded p-1 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50"
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
