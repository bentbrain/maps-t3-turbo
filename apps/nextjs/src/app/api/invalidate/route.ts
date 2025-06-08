import { createHmac, timingSafeEqual } from "crypto";
import { revalidateTag } from "next/cache";

import { env } from "@acme/env/env";

// Define the expected request body type
interface NotionWebhookBody {
  verification_token?: string;
  type?: string;
  entity?: {
    id?: string;
    type?: string;
  };
  data?: {
    parent?: {
      id?: string;
      type?: string;
    };
    updated_properties?: string[];
    updated_blocks?: { id: string; type: string }[];
    page_id?: string; // For comment events
  };
  authors?: { id: string; type: string }[];
  [key: string]: string | number | boolean | object | undefined;
}

// Events that require cache invalidation for map data
const RELEVANT_EVENTS = [
  // Page events in databases
  "page.created",
  "page.properties_updated",
  "page.content_updated",
  "page.moved",
  "page.deleted",
  "page.undeleted",
  // Database events
  "database.created",
  "database.content_updated",
  "database.moved",
  "database.deleted",
  "database.undeleted",
  "database.schema_updated",
];

function handlePageInDatabaseEvent(
  databaseId: string,
  pageId: string,
  eventType: string,
  authors?: { id: string; type: string }[],
): Response {
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

  console.log(
    "🔄 Page-in-database cache invalidation triggered by:",
    eventType,
  );
  console.log(`🗑️ Clearing cache for database:`, databaseId);
  console.log(`🗑️ Clearing cache for page:`, pageId);

  // Revalidate the database and page
  revalidateTag(databaseId);
  revalidateTag(pageId);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Revalidated database: ${databaseId} and page: ${pageId}`,
      eventType,
      invalidatedTags: [databaseId, pageId],
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

function handleDatabaseEvent(
  databaseId: string,
  eventType: string,
  authors?: { id: string; type: string }[],
): Response {
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

  console.log("🔄 Database cache invalidation triggered by:", eventType);
  console.log(`🗑️ Clearing cache for database:`, databaseId);

  // Revalidate the database
  revalidateTag(databaseId);

  return new Response(
    JSON.stringify({
      success: true,
      message: `Revalidated database: ${databaseId}`,
      eventType,
      invalidatedTags: [databaseId],
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
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

    // Check if this is a relevant event type
    const eventType = jsonBody.type ?? "unknown";
    if (!RELEVANT_EVENTS.includes(eventType)) {
      console.log(`⏭️ Skipping irrelevant event type: ${eventType}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Skipped irrelevant event: ${eventType}`,
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

    // Handle page events in databases
    if (
      jsonBody.data?.parent?.type === "database" &&
      jsonBody.data.parent.id &&
      jsonBody.entity?.id &&
      jsonBody.entity.type === "page"
    ) {
      return handlePageInDatabaseEvent(
        jsonBody.data.parent.id,
        jsonBody.entity.id,
        eventType,
        jsonBody.authors,
      );
    }

    // Handle direct database events
    if (jsonBody.entity?.type === "database" && jsonBody.entity.id) {
      return handleDatabaseEvent(
        jsonBody.entity.id,
        eventType,
        jsonBody.authors,
      );
    }

    // Handle other webhook events that don't require cache invalidation
    console.log("Valid webhook received but no cache invalidation needed:", {
      eventType,
      entityType: jsonBody.entity?.type,
      parentType: jsonBody.data?.parent?.type,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed but no cache invalidation needed",
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
