import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@acme/env/env";

interface UnfurlRequest {
  uri: string;
}

function parseAccessToken(header: string) {
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", env.NOTION_LINK_PREVIEW_CLIENT_SECRET)
    .update(payload)
    .digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return null;
  } catch {
    return null;
  }
  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as unknown as { sub: string };
    return json.sub as string | null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const tokenSub = parseAccessToken(authHeader);
    if (!tokenSub) {
      const body = (await req.json()) as UnfurlRequest | undefined | null;
      const uri = body && typeof body.uri === "string" ? body.uri : "";
      return NextResponse.json(
        {
          uri,
          operations: [
            {
              path: ["error"],
              set: { status: 401, message: "Unauthorized" },
            },
          ],
        },
        { status: 200 },
      );
    }

    const body = (await req.json()) as UnfurlRequest;

    const urlParam = new URL(body.uri);
    const pathname = urlParam.pathname;

    // Example pattern: https://notionmaps.app/share/<databaseId>
    const shareRegex = /\/share\/([0-9a-f-]{32,36})/i;
    const shareMatch = shareRegex.exec(pathname);
    const databaseId = shareMatch?.[1];

    if (!databaseId) {
      return NextResponse.json(
        {
          uri: body.uri,
          operations: [
            {
              path: ["error"],
              set: { status: 404, message: "Unsupported URL" },
            },
          ],
        },
        { status: 200 },
      );
    }

    const title = "Notion Maps Share";
    const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const viewUrl = `${site}/share/${databaseId}`;

    return NextResponse.json({
      uri: body.uri,
      operations: [
        {
          path: ["attributes"],
          set: [
            {
              id: "title",
              name: "Title",
              type: "inline",
              inline: {
                title: {
                  value: `${title}`,
                  section: "title",
                },
              },
            },
            {
              id: "dev",
              name: "Developer",
              type: "inline",
              inline: {
                plain_text: {
                  value: "Notion Locations",
                  section: "secondary",
                },
              },
            },
            {
              id: "link",
              name: "Open",
              type: "inline",
              inline: {
                link: {
                  value: viewUrl,
                  section: "subtitle",
                },
              },
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Unfurl failed:", error);
    return NextResponse.json(
      {
        uri: "",
        operations: [
          {
            path: ["error"],
            set: { status: 500, message: "Unfurl failed" },
          },
        ],
      },
      { status: 200 },
    );
  }
}
