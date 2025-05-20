"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import type { RouterOutputs } from "@acme/api";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

export function DatabaseList({
  userId,
  databases,
}: {
  userId: string;
  databases: RouterOutputs["user"]["getUserDatabasesFromNotion"];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/${userId}/${selected}`);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Select a database</CardTitle>
      </CardHeader>
      <CardContent>
        <Select onValueChange={setSelected} defaultValue={selected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a database" />
          </SelectTrigger>
          <SelectContent>
            {databases.map((database) => (
              <SelectItem key={database.id} value={database.id}>
                {database.icon?.type === "emoji" && (
                  <span className="text-xs">{database.icon.emoji}</span>
                )}
                <span>{database.title[0]?.plain_text}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          className="group cursor-pointer"
          disabled={!selected}
          onClick={handleContinue}
        >
          Continue{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
