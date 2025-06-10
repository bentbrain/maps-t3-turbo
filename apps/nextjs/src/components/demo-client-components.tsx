"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Notion } from "@ridemountainpig/svgl-react";

import { Button } from "@acme/ui/button";

export const SignInButtons = () => {
  return (
    <>
      <SignedOut>
        <Button className="cursor-pointer" variant="outline" asChild>
          <SignInButton>
            <span className="flex items-center gap-2">
              <Notion className="hidden h-5 w-5 sm:block" />
              <span className="block sm:hidden">Sign in</span>
              <span className="hidden sm:block">Sign in with Notion</span>
            </span>
          </SignInButton>
        </Button>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
};
