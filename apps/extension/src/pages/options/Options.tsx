import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Database, LoaderCircle } from "lucide-react";
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
import { Input } from "@acme/ui/input";

interface StorageData {
  notionDatabaseId?: string;
}

const formSchema = z.object({
  databaseId: z.string().uuid(),
});

type FormData = z.infer<typeof formSchema>;

export default function Options() {
  const [isSuccess, setIsSuccess] = useState(false);
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
      const data = (await Browser.storage.sync.get([
        "notionDatabaseId",
      ])) as StorageData;

      if (data.notionDatabaseId) {
        form.reset({ databaseId: data.notionDatabaseId });
      }
    };

    loadSettings();
  }, [form]);

  async function onSubmit(values: FormData) {
    try {
      await Browser.storage.sync.set({
        notionDatabaseId: values.databaseId,
      });

      setIsSuccess(true);
      form.reset({ databaseId: values.databaseId });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  return (
    <div className="p-0 pb-4">
      <div className="container mx-auto max-w-2xl space-y-8">
        <Card className="border-none p-0">
          <CardHeader>
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
                      <FormLabel className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Notion Database ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your Notion database ID"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The ID of the database where locations will be saved.{" "}
                        <a
                          href="https://developers.notion.com/reference/retrieve-a-database#:~:text=To%20find%20a%20database%20ID%2C%20navigate%20to%20the%20database%20URL%20in%20your%20Notion%20workspace.%20The%20ID%20is%20the%20string%20of%20characters%20in%20the%20URL%20that%20is%20between%20the%20slash%20following%20the%20workspace%20name%20(if%20applicable)%20and%20the%20question%20mark.%20The%20ID%20is%20a%2032%20characters%20alphanumeric%20string."
                          target="_blank"
                          className="underline"
                          rel="noopener noreferrer"
                        >
                          Click here for more information.
                        </a>
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
