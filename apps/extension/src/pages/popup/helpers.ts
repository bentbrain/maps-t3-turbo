import Browser from "webextension-polyfill";

export async function getSelectedDatabaseId() {
  const { notionDatabaseId } =
    await Browser.storage.sync.get("notionDatabaseId");

  return typeof notionDatabaseId === "string" ? notionDatabaseId : undefined;
}
