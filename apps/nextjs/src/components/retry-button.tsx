"use client";

import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

import { Button } from "@acme/ui/button";

function RetryButton() {
  const router = useRouter();
  return (
    <Button
      className="w-full sm:w-auto"
      variant="outline"
      onClick={() => router.refresh()}
    >
      <RefreshCcw className="h-4 w-4" />
    </Button>
  );
}

export default RetryButton;
