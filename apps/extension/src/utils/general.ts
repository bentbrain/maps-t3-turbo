const extractGoogleMapsLocationData = async () => {
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

    // Extract address - handle both business and residential formats
    let address = "";

    // Method 1: Try business format - button with data-item-id="address" and address in aria-label
    const businessAddressButton = panel.querySelector(
      'button[data-item-id="address"]',
    );
    if (businessAddressButton) {
      const ariaLabel = businessAddressButton.getAttribute("aria-label") || "";
      if (ariaLabel && !ariaLabel.toLowerCase().includes("copy address")) {
        address = ariaLabel
          .replace(/^Address[,:]?\s*/i, "") // Remove "Address:" prefix
          .replace(/^Location:\s*/i, "") // Remove "Location:" prefix
          .trim();
      }
    }

    // Method 2: Try residential format - look for address near the address icon
    if (!address) {
      // Find the address icon (span with aria-label="Address" and role="img")
      const addressIcon = panel.querySelector(
        'span[aria-label="Address"][role="img"]',
      );
      if (addressIcon) {
        // Navigate to parent container and look for text content
        const container = addressIcon.closest('div[role="button"]');
        if (container) {
          // Look for spans that contain address-like text (not just icons or buttons)
          const textSpans = container.querySelectorAll("span");
          for (const span of textSpans) {
            const text = span.textContent?.trim() || "";
            // Check if this looks like an address (contains numbers and street-like words)
            if (
              text &&
              text.length > 10 && // Reasonable address length
              /\d+/.test(text) && // Contains numbers
              /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|place|pl|court|ct)\b/i.test(
                text,
              )
            ) {
              address = text;
              break;
            }
          }
        }
      }
    }

    // Method 3: Try div[role="button"] with Address in aria-label (older format)
    if (!address) {
      const divAddressElement = panel.querySelector(
        'div[role="button"][aria-label^="Address"]',
      );
      if (divAddressElement) {
        const ariaLabel = divAddressElement.getAttribute("aria-label") || "";
        if (ariaLabel && !ariaLabel.toLowerCase().includes("copy address")) {
          address = ariaLabel
            .replace(/^Address[,:]?\s*/i, "")
            .replace(/^Location:\s*/i, "")
            .trim();
        }
      }
    }

    // Method 4: Fallback - look for any button/div that might contain address patterns
    if (!address) {
      const elements = Array.from(
        panel.querySelectorAll('div[role="button"], button'),
      ) as (HTMLDivElement | HTMLButtonElement)[];

      for (const element of elements) {
        const ariaLabel = element.getAttribute("aria-label") || "";
        if (
          ariaLabel &&
          !ariaLabel.toLowerCase().includes("copy address") &&
          (ariaLabel.toLowerCase().includes("address") ||
            ariaLabel.match(
              /\d+\s+[a-zA-Z\s]+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr)/i,
            ))
        ) {
          address = ariaLabel
            .replace(/^Address[,:]?\s*/i, "")
            .replace(/^Location:\s*/i, "")
            .trim();
          break;
        }
      }
    }

    // Find all !3d<lat>!4d<lng> pairs in the URL and use the last one
    const url = window.location.href;

    const matches = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g);
    if (!matches) {
      // Try alternate coordinate format
      const altMatches = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (altMatches) {
        const [, latitude, longitude] = altMatches;
        return {
          title,
          address,
          longitude,
          latitude,
        };
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

    return {
      title,
      address,
      longitude,
      latitude,
    };
  } catch (error) {
    console.error("Error extracting Google Maps location data:", error);
    throw error;
  }
};

// Unified helper to wait for elements with lazy loading support
const waitForElement = async (
  selector: string,
  options: {
    timeout?: number;
    requireBackgroundImage?: boolean;
  } = {},
): Promise<Element> => {
  const { timeout = 10000, requireBackgroundImage = false } = options;

  // Try to trigger lazy loading first
  await triggerLazyLoading();

  return new Promise((resolve, reject) => {
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (!element) return false;

      if (requireBackgroundImage) {
        const style = window.getComputedStyle(element as HTMLElement);
        const bg = style.backgroundImage;
        return bg && bg !== "none" && bg.includes("maps.google.com");
      }
      return true;
    };

    // Quick check first
    if (checkElement()) {
      resolve(document.querySelector(selector)!);
      return;
    }

    // Set up observer
    const observer = new MutationObserver(() => {
      if (checkElement()) {
        observer.disconnect();
        resolve(document.querySelector(selector)!);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "style", "class"],
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not ready within ${timeout}ms`));
    }, timeout);
  });
};

// Trigger lazy loading by making elements temporarily visible
const triggerLazyLoading = async (): Promise<void> => {
  // Dispatch global events first
  window.dispatchEvent(new Event("scroll"));
  window.dispatchEvent(new Event("resize"));

  // Find map containers that might need lazy loading
  const containers = document.querySelectorAll(
    '[class*="map"], [id*="map"], [data-testid*="map"], .static-map__img, [class*="listing"]',
  );

  if (containers.length > 0) {
    // Store original positions
    const originalStyles = new Map();

    containers.forEach((container) => {
      const element = container as HTMLElement;

      // Store original style
      originalStyles.set(element, element.style.cssText);

      // Make element temporarily visible in viewport (but hidden)
      element.style.position = "fixed";
      element.style.top = "50%";
      element.style.left = "50%";
      element.style.zIndex = "-9999";
      element.style.visibility = "hidden";
      element.style.pointerEvents = "none";
      element.style.opacity = "0";

      // Dispatch events that lazy loaders listen for
      element.dispatchEvent(new Event("appear"));
      element.dispatchEvent(new Event("inview"));
    });

    // Force reflow to trigger intersection observers
    document.body.offsetHeight;

    // Wait for lazy loading to process
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Restore original styles
    containers.forEach((container) => {
      const element = container as HTMLElement;
      element.style.cssText = originalStyles.get(element) || "";
    });
  }

  // Additional wait for images to start loading
  await new Promise((resolve) => setTimeout(resolve, 200));
};

const extractDomainLocationData = async () => {
  try {
    const listingSummary = document.querySelector(
      'div[data-testid="listing-details__summary"]',
    );

    const address =
      listingSummary?.querySelector("h1")?.textContent?.trim() || "";

    // Wait for the map image to load
    await waitForElement('img[alt="Static Google Map"]');

    const mapImage = document
      .querySelector('img[alt="Static Google Map"]')
      ?.getAttribute("src");

    if (!mapImage) {
      throw new Error("Could not find map image source");
    }

    const mapImageUrl = new URL(mapImage);
    const mapImageUrlParams = new URLSearchParams(mapImageUrl.search);

    const latitude = mapImageUrlParams.get("center")?.split(",")[0] || "";
    const longitude = mapImageUrlParams.get("center")?.split(",")[1] || "";

    if (!latitude || !longitude) {
      throw new Error("Could not extract coordinates from map URL");
    }

    console.log("Domain coordinates:", latitude, longitude);

    return {
      title: address,
      address,
      longitude,
      latitude,
    };
  } catch (error) {
    console.error("Error extracting Domain location data:", error);
    throw error;
  }
};

const extractRealEstateData = async () => {
  try {
    const address =
      document
        ?.querySelector("h1.property-info-address")
        ?.textContent?.trim() || "";

    // Wait for the map element and its background image to load
    const mapElement = (await waitForElement(".static-map__img", {
      requireBackgroundImage: true,
    })) as HTMLElement;

    const computedStyle = window.getComputedStyle(mapElement);
    const backgroundImage = computedStyle.backgroundImage;

    // Extract URL from CSS background-image property
    // backgroundImage looks like: url("https://maps.google.com/maps/api/staticmap?...")
    const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    if (!urlMatch) {
      throw new Error("Could not extract URL from background image");
    }

    const mapImageUrl = new URL(urlMatch[1]);

    // Get the markers parameter which contains the coordinates
    const markersParam = mapImageUrl.searchParams.get("markers");
    if (!markersParam) {
      throw new Error("Could not find markers parameter in map URL");
    }

    // markers parameter format: "icon:url|latitude,longitude"
    // Example: "icon:https://assets.reastatic.net/realestate.com.au/map/map-pin-v2.png|-27.48151401,153.00243563"
    const coordsMatch = markersParam.match(/\|(-?\d+\.\d+),(-?\d+\.\d+)$/);
    if (!coordsMatch) {
      throw new Error("Could not extract coordinates from markers parameter");
    }

    const [, latitude, longitude] = coordsMatch;

    console.log("RealEstate coordinates:", latitude, longitude);

    return {
      title: address,
      address,
      longitude,
      latitude,
    };
  } catch (error) {
    console.error("Error extracting RealEstate.com.au location data:", error);
    throw error;
  }
};

export const supportedDomains = {
  googleMaps: {
    url: "google.com/maps",
    matcher: "*://*.google.com/maps/*",
    displayName: "Google Maps",
    extractor: extractGoogleMapsLocationData,
  },
  domain: {
    url: "domain.com.au",
    matcher: "*://*.domain.com.au/*",
    displayName: "Domain",
    extractor: extractDomainLocationData,
  },
  realEstate: {
    url: "realestate.com.au",
    matcher: "*://*.realestate.com.au/*",
    displayName: "realestate.com.au",
    extractor: extractRealEstateData,
  },
} as const;
