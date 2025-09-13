import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { env } from "@acme/env/env";

function signPayload(payload: object) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", env.NOTION_LINK_PREVIEW_COOKIE_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const signinUrl = new URL(`${site}/sign-in`);
    // Redirect back to this authorize URL after sign-in, preserving query params
    signinUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signinUrl.toString(), { status: 302 });
  }
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state") ?? "";

  if (!clientId || clientId !== env.NOTION_LINK_PREVIEW_CLIENT_ID) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }
  if (!redirectUri) {
    return NextResponse.json(
      { error: "invalid_redirect_uri" },
      { status: 400 },
    );
  }
  try {
    const redirect = new URL(redirectUri);
    const host = redirect.hostname.toLowerCase();
    const isHttps = redirect.protocol === "https:";
    const isNotionHost =
      host.endsWith("notion.so") ||
      host.endsWith("notion.com") ||
      host === "api.notion.com";
    if (!isHttps || !isNotionHost) {
      return NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "invalid_redirect_uri" },
      { status: 400 },
    );
  }

  const code = signPayload({
    iss: env.NOTION_LINK_PREVIEW_DOMAIN,
    aud: "notion",
    redirect_uri: redirectUri,
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  });

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);

  return NextResponse.redirect(redirect.toString(), { status: 302 });
}
