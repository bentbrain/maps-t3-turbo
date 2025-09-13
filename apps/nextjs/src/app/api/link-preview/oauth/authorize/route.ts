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
  console.log("[link-preview][authorize] GET start", { url: req.url });
  const { userId } = await auth();
  if (!userId) {
    console.warn("[link-preview][authorize] no user; redirecting to sign-in", {
      url: req.url,
    });
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

  console.log("[link-preview][authorize] parsed params", {
    hasClientId: Boolean(clientId),
    hasRedirectUri: Boolean(redirectUri),
    state: state ? "present" : "",
  });

  if (!clientId || clientId !== env.NOTION_LINK_PREVIEW_CLIENT_ID) {
    console.warn("[link-preview][authorize] invalid_client", { clientId });
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }
  if (!redirectUri) {
    console.warn("[link-preview][authorize] missing redirect_uri");
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
      console.warn(
        "[link-preview][authorize] invalid_redirect_uri host/protocol",
        {
          host,
          protocol: redirect.protocol,
        },
      );
      return NextResponse.json(
        { error: "invalid_redirect_uri" },
        { status: 400 },
      );
    }
  } catch {
    console.warn("[link-preview][authorize] invalid_redirect_uri parse error", {
      redirectUri,
    });
    return NextResponse.json(
      { error: "invalid_redirect_uri" },
      { status: 400 },
    );
  }

  console.log("[link-preview][authorize] issuing code", {
    sub: userId,
    redirectUri,
  });
  const code = signPayload({
    iss: env.NOTION_LINK_PREVIEW_DOMAIN,
    aud: "notion",
    redirect_uri: redirectUri,
    sub: userId,
    client_id: clientId,
    state,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 5 * 60,
  });

  const redirect = new URL(redirectUri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);

  console.log("[link-preview][authorize] redirecting", {
    to: redirect.toString(),
  });
  return NextResponse.redirect(redirect.toString(), { status: 302 });
}
