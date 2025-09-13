import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@acme/env/env";

function verifyCode(code: string) {
  const [data, sig] = code.split(".");
  if (!data || !sig) return null;
  const expected = crypto
    .createHmac("sha256", env.NOTION_LINK_PREVIEW_COOKIE_SECRET)
    .update(data)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  const json = JSON.parse(
    Buffer.from(data, "base64url").toString("utf8"),
  ) as unknown as { exp: number; redirect_uri: string; sub: string };
  if (json.exp && Date.now() / 1000 > json.exp) return null;
  return json as { redirect_uri: string; sub: string };
}

function generateAccessToken(subject: string) {
  const payload = Buffer.from(
    JSON.stringify({ sub: subject, iat: Math.floor(Date.now() / 1000) }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", env.NOTION_LINK_PREVIEW_CLIENT_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);

  const grantType = params.get("grant_type");
  const code = params.get("code");
  const redirectUri = params.get("redirect_uri");
  const clientId = params.get("client_id");
  const clientSecret = params.get("client_secret");

  if (grantType !== "authorization_code") {
    return NextResponse.json(
      { error: "unsupported_grant_type" },
      { status: 400 },
    );
  }
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
  if (
    clientId !== env.NOTION_LINK_PREVIEW_CLIENT_ID ||
    clientSecret !== env.NOTION_LINK_PREVIEW_CLIENT_SECRET
  ) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }
  if (!code || !redirectUri) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const decoded = verifyCode(code);
  if (!decoded || decoded.redirect_uri !== redirectUri) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  const accessToken = generateAccessToken(decoded.sub);

  return NextResponse.json({
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
  });
}
