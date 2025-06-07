import Browser from "webextension-polyfill";

interface LocationData {
  title: string;
  address: string;
  longitude: string;
  latitude: string;
  emoji?: string;
  tags?: string[];
  city?: string;
}

// Function to insert extension detection div on target domains
function insertExtensionDetectionDiv(): void {
  const currentHost = window.location.hostname;
  const isDevelopment = import.meta.env.MODE === "development";
  const expectedHost = isDevelopment ? "localhost" : "www.notionlocations.com";
  const isTargetDomain = currentHost === expectedHost;

  if (isTargetDomain) {
    // Check if div already exists to avoid duplicates
    if (!document.getElementById("ExtensionInstalled")) {
      const div = document.createElement("div");
      div.id = "ExtensionInstalled";
      div.style.display = "none";
      div.style.visibility = "hidden";
      div.style.position = "absolute";
      div.style.top = "-9999px";

      // Add version number as data attribute
      const manifest = Browser.runtime.getManifest();
      div.setAttribute("data-version", manifest.version);

      // Insert at the beginning of body or head if body not available yet
      const target = document.body || document.head || document.documentElement;
      target.appendChild(div);
    }
  }
}

// Insert the detection div when the script loads
insertExtensionDetectionDiv();

async function extractLocationData(): Promise<LocationData | null> {
  // Check if we're on Google Maps
  if (!window.location.href.includes("google.com/maps")) {
    throw new Error("Please open this extension on Google Maps");
  }

  try {
    // Get the main panel that contains location details
    const panel = document.querySelector('div[role="main"]');
    if (!panel) {
      throw new Error("Could not find location panel");
    }

    // Extract title
    const titleElement = panel.querySelector("h1");
    const title = titleElement?.textContent?.trim() || "";

    if (!title) {
      throw new Error("Could not find title");
    }

    // Extract address
    // Try the div[role="button"] format first
    let addressElement = panel.querySelector(
      'div[role="button"][aria-label^="Address"]',
    );

    // If not found, try the button[data-item-id="address"] format
    if (!addressElement) {
      addressElement = panel.querySelector('button[data-item-id="address"]');
    }

    // If still not found, try looking for any elements containing an address
    if (!addressElement) {
      const elements = Array.from(
        panel.querySelectorAll('div[role="button"], button'),
      ) as (HTMLDivElement | HTMLButtonElement)[];
      addressElement =
        elements.find((element) => {
          const ariaLabel = element.getAttribute("aria-label");
          return (
            ariaLabel &&
            (ariaLabel.toLowerCase().includes("address") ||
              // Common patterns in residential addresses
              ariaLabel.match(
                /\d+\s+[a-zA-Z\s]+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr)/i,
              ))
          );
        }) || null;
    }

    const addressAriaLabel = addressElement?.getAttribute("aria-label") || "";
    const address =
      addressAriaLabel
        .replace(/^Address[,:]?\s*/i, "") // Remove "Address:" or "Address, " prefix, case insensitive
        .replace(/^Location:\s*/i, "") // Remove "Location: " prefix if present
        .trim() || "";

    // Find all !3d<lat>!4d<lng> pairs in the URL and use the last one
    const url = window.location.href;

    const matches = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g);
    if (!matches) {
      // Try alternate coordinate format
      const altMatches = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (altMatches) {
        const [, latitude, longitude] = altMatches;
        const data = {
          title,
          address,
          longitude,
          latitude,
        };
        return data;
      }
      throw new Error("Could not find coordinates in URL");
    }

    // Get the last match and extract coordinates
    const lastMatch = matches[matches.length - 1];
    const coords = lastMatch.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (!coords) {
      throw new Error("Could not find coordinates in URL");
    }

    const [, latitude, longitude] = coords;

    const data = {
      title,
      address,
      longitude,
      latitude,
    };

    return data;
  } catch (error) {
    console.error("Error extracting location data:", error);
    throw error;
  }
}

// Only respond to explicit messages from the popup
Browser.runtime.onMessage.addListener((message: any) => {
  if (message.action === "getLocationData") {
    return extractLocationData().then((data) => {
      return data;
    });
  }
  return Promise.resolve(undefined);
});
