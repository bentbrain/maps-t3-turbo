import { Button } from "@acme/ui/button";

export const SignInPage = () => {
  const websiteUrl = import.meta.env.VITE_WEBSITE_URL;

  return (
    <div className="absolute inset-0 grid place-items-center p-4">
      <div className="flex flex-col gap-4 text-center">
        <div className="grid place-items-center gap-2">
          <img src="/icon-32.png" alt="Notion Locations" className="size-8" />
          <h2 className="text-xl font-bold">Notion Locations</h2>
          <p className="text-muted-foreground text-sm text-balance">
            Save locations from Google Maps directly to your Notion databases
          </p>
        </div>
        <Button asChild className="w-full">
          <a
            href={`${websiteUrl}/sign-in`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sign In to Continue
          </a>
        </Button>
      </div>
    </div>
  );
};
