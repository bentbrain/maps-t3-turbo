import Browser from "webextension-polyfill";

// Listen for messages from the extension
Browser.runtime.onMessage.addListener(
  (message: unknown, sender: Browser.Runtime.MessageSender) => {
    // No API calls needed in the background script anymore
    // The background script can be used for other extension-specific functionality if needed
    console.log("Background script received message:", message);
    return Promise.resolve({ error: "Unknown message type" });
  }
);

// Initialize on install
Browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

console.log("background script loaded");
