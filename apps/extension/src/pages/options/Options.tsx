import { useEffect, useState } from "react";
import { trpcClient } from "@/utils/api";
import { ClerkProvider, SignedIn } from "@clerk/chrome-extension";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import Browser from "webextension-polyfill";
import * as z from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";

import { DatabaseSelect } from "../../components/DatabaseSelect";

const PUBLISHABLE_KEY = import.meta.env.VITE_PUBLISHABLE_KEY;
const SYNC_HOST = import.meta.env.VITE_PUBLIC_CLERK_SYNC_HOST;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Please add the VITE_PUBLISHABLE_KEY to the .env.development file",
  );
}

if (!SYNC_HOST) {
  throw new Error(
    "Please add the VITE_CLERK_SYNC_HOST to the .env.development file",
  );
}

interface StorageData {
  notionDatabaseId?: string;
}

const formSchema = z.object({
  databaseId: z.string().min(1, "Please select a database"),
});

type FormData = z.infer<typeof formSchema>;

async function fetchUserDatabases() {
  const data = await trpcClient.user.getUserDatabasesFromNotion.query();

  await Browser.storage.local.set({
    userDatabases: data,
    lastFetched: Date.now(),
  });

  return data;
}

async function getSelectedDatabaseId() {
  const data = (await Browser.storage.sync.get([
    "notionDatabaseId",
  ])) as StorageData;
  return data.notionDatabaseId;
}

function OptionsContent() {
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      databaseId: "",
    },
  });

  const { isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    // Reset success state when form changes
    if (isDirty) {
      setIsSuccess(false);
    }
  }, [isDirty]);

  useEffect(() => {
    // Load saved settings
    const loadSettings = async () => {
      const selectedId = await getSelectedDatabaseId();
      if (selectedId) {
        form.reset({ databaseId: selectedId });
      }
    };

    loadSettings();
  }, [form]);

  async function onSubmit(values: FormData) {
    try {
      await Browser.storage.sync.set({
        notionDatabaseId: values.databaseId,
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["selectedDatabaseId"] });

      setIsSuccess(true);
      form.reset({ databaseId: values.databaseId });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  return (
    <div className="p-6 pb-4">
      <div className="container mx-auto max-w-2xl space-y-8">
        <Card>
          <CardHeader>
            <img
              src="/icon-32.png"
              alt="Notion Maps Logo"
              className="mb-1 h-8 w-8"
            />
            <CardTitle className="text-2xl">Notion Maps Settings</CardTitle>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="databaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notion Database</FormLabel>
                      <FormControl>
                        <DatabaseSelect
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Select the database where locations will be saved.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !isDirty || isSuccess}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : isSuccess ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      <span>Saved</span>
                    </div>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default function Options() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} syncHost={SYNC_HOST}>
      <SignedIn>
        <OptionsContent />
      </SignedIn>
    </ClerkProvider>
  );
}
