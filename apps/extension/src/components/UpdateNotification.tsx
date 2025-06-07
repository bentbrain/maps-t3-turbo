import { useEffect, useState } from "react";
import { DownloadIcon, X } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

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

  const handleUpdate = () => {
    if (updateInfo?.releaseUrl) {
      chrome.tabs.create({
        url: `${import.meta.env.VITE_WEBSITE_URL}#download`,
      });
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
    <Card className="gap-3 rounded-sm p-3 shadow-none">
      <CardHeader className="p-0">
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <DownloadIcon className="h-4 w-4" /> Update available
            </div>
            <Button variant="ghost" size={"icon"} onClick={handleDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">
          A new version of the extension is available.
        </CardDescription>
      </CardHeader>
      <CardFooter className="grid grid-cols-2 gap-2 p-0">
        <Button className="text-xs" size={"sm"} onClick={handleUpdate}>
          Update
        </Button>
        <Button
          className="text-xs"
          size={"sm"}
          variant="outline"
          onClick={handleViewRelease}
        >
          View release
        </Button>
      </CardFooter>
    </Card>
  );
}
