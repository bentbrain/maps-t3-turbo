import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NEXT_PRIVATE_NOTION_DATABASE_ID: z.string().min(1),
    NEXT_PRIVATE_NOTION_VERIFICATION_TOKEN: z.string().min(1),
    NEXT_PRIVATE_UNRESTRICTED_MAPS_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    CHROME_EXECUTABLE_PATH: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_NOTION_TOKEN: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_ID: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_VERCEL_ENVIRONMENT: z.enum([
      "development",
      "test",
      "production",
    ]),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    NEXT_PRIVATE_UNRESTRICTED_MAPS_KEY:
      process.env.NEXT_PRIVATE_UNRESTRICTED_MAPS_KEY,
    NEXT_PUBLIC_NOTION_TOKEN: process.env.NEXT_PUBLIC_NOTION_TOKEN,
    NEXT_PRIVATE_NOTION_DATABASE_ID:
      process.env.NEXT_PRIVATE_NOTION_DATABASE_ID,
    NEXT_PRIVATE_NOTION_VERIFICATION_TOKEN:
      process.env.NEXT_PRIVATE_NOTION_VERIFICATION_TOKEN,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_VERCEL_ENVIRONMENT: process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT,
    CHROME_EXECUTABLE_PATH: process.env.CHROME_EXECUTABLE_PATH,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  // }
});
