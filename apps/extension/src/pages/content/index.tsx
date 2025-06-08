import { supportedDomains } from "@/utils/general";
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

// Type for extraction strategies
type LocationExtractor = {
  canExtract: (url: string) => boolean;
  extractLocationData: () => Promise<LocationData>;
};

// Auto-generate extractors from supportedDomains config
const createExtractorsFromConfig = (): LocationExtractor[] => {
  return Object.entries(supportedDomains).map(([domainKey, domainConfig]) => ({
    canExtract: (url: string) => url.includes(domainConfig.url),
    extractLocationData: domainConfig.extractor,
  }));
};

// Registry functions
const createExtractorRegistry = (extractors: LocationExtractor[]) => ({
  getExtractor: (url: string) =>
    extractors.find((extractor) => extractor.canExtract(url)) || null,
  addExtractor: (extractor: LocationExtractor) => extractors.push(extractor),
  getAllExtractors: () => [...extractors],
});

// Initialize the registry with auto-generated extractors
const extractorRegistry = createExtractorRegistry(createExtractorsFromConfig());

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
  const currentUrl = window.location.href;
  console.log("currentUrl: ", currentUrl);
  const extractor = extractorRegistry.getExtractor(currentUrl);

  if (!extractor) {
    const supportedSites = Object.values(supportedDomains)
      .map((config) => config.displayName)
      .join(", ");
    throw new Error(
      `No extractor found for URL: ${currentUrl}. Supported sites: ${supportedSites}`,
    );
  }

  return await extractor.extractLocationData();
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
