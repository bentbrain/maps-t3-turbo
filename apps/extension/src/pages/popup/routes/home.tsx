import { SignedIn, SignedOut } from "@clerk/chrome-extension";

import { Button } from "@acme/ui/button";

import LocationForm from "../location-form";

export const Home = () => {
  const websiteUrl = import.meta.env.VITE_WEBSITE_URL;
  console.log(websiteUrl);

  return (
    <>
      <SignedIn>
        <LocationForm />
      </SignedIn>
      <SignedOut>
        <div className="absolute inset-0 grid h-full place-items-center">
          <Button asChild>
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
              Sign In
            </a>
          </Button>
        </div>
      </SignedOut>
    </>
  );
};
