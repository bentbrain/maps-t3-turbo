import { createHmac, timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";
import { Client } from "@notionhq/client";

import { env } from "@acme/env/env";

// Define the expected request body type
interface NotionWebhookBody {
  verification_token?: string;
  type?: string;
  entity?: {
    id?: string;
  };
  data?: {
    parent?: {
      id?: string;
      type?: string;
    };
    updated_properties?: string[];
  };
  authors?: { id: string; type: string }[];
  [key: string]: string | number | boolean | object | undefined;
}

// Initialize Notion client
const notion = new Client({
  auth: env.NEXT_PUBLIC_NOTION_TOKEN,
});

// Properties we want to check for
const LOCATION_PROPERTIES = ["Latitude", "Longitude"];

async function handleDatabaseEvent(
  databaseId: string,
  eventType: string,
  authors?: { id: string; type: string }[],
): Promise<Response> {
  // Ignore bot-authored updates to avoid loops
  if (authors?.some((author) => author.type === "bot")) {
    console.log("⏭️ Skipping bot-authored update");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Skipped bot-authored update",
        eventType,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  // Check if the database has location properties and get its properties
  try {
    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const properties = response.properties;

    // Check if all location properties exist in the database
    const hasLocationProperties = LOCATION_PROPERTIES.every((prop) =>
      Object.values(properties).some((p) => p.name === prop),
    );

    // Revalidate all pages in the database
    const pages = await notion.databases.query({
      database_id: databaseId,
    });
    pages.results.forEach((page) => {
      revalidateTag(page.id);
    });

    if (hasLocationProperties) {
      console.log("🔄 Cache invalidation triggered by:", eventType);
      console.log(`🗑️ Clearing cache for path:`, databaseId);

      // Revalidate both paths
      console.log(`♻️ Revalidating path: ${databaseId}`);
      revalidateTag(databaseId);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Revalidated path: ${databaseId}`,
          reason: "Database contains location properties",
          eventType,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(
      "⏭️ Skipping cache invalidation - Database does not contain location properties",
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Database does not contain location properties",
        eventType,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error checking database properties:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to check database properties",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the verification token from environment variables
    const verificationToken = env.NEXT_PRIVATE_NOTION_VERIFICATION_TOKEN;
    if (!verificationToken) {
      throw new Error("Verification token not found in environment variables");
    }

    // Get the Notion signature from headers
    const notionSignature = request.headers.get("x-notion-signature");
    if (!notionSignature) {
      throw new Error("No Notion signature found in headers");
    }

    // Clone the request to read the body as we can only read it once
    const clone = request.clone();

    // Read the request body as text
    const body = await clone.text();

    // Log the raw body for debugging
    console.log("Raw webhook body:", body);

    // Parse the body as JSON if it's not empty
    let jsonBody: NotionWebhookBody = {};
    try {
      if (body) {
        jsonBody = JSON.parse(body) as NotionWebhookBody;
        console.log("Parsed webhook body:", JSON.stringify(jsonBody, null, 2));
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
      throw new Error("Invalid JSON body");
    }

    // Validate the webhook signature
    const calculatedSignature = `sha256=${createHmac(
      "sha256",
      verificationToken,
    )
      .update(body)
      .digest("hex")}`;

    const isValidSignature = timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(notionSignature),
    );

    if (!isValidSignature) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid signature",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // If this is the initial verification request, return the verification token
    if (jsonBody.verification_token) {
      console.log("Verification token received:", jsonBody.verification_token);
      return new Response(
        JSON.stringify({
          success: true,
          verificationToken: jsonBody.verification_token,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Check if event has a database parent
    if (jsonBody.data?.parent?.type === "database" && jsonBody.data.parent.id) {
      return handleDatabaseEvent(
        jsonBody.data.parent.id,
        jsonBody.type ?? "unknown",
        jsonBody.authors,
      );
    }

    // Handle other webhook events
    console.log("Valid webhook received:", {
      signature: notionSignature,
      body: jsonBody,
    });

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
