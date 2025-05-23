import { ImageResponse } from "next/og";
import { caller } from "@/trpc/server";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default async function Icon({
  params,
}: {
  params: { databaseId: string };
}) {
  const { databaseId } = params;

  const databases = await caller.user.getUserDatabasesFromNotion();

  const database = databases.find((db) => db.id === databaseId);

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {database?.icon?.type === "emoji" ? database.icon.emoji : "📍"}
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
