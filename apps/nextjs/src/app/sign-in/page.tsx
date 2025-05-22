import React from "react";
import { SignIn } from "@clerk/nextjs";

function Page() {
  return (
    <main className="grid h-dvh place-items-center">
      <SignIn />
    </main>
  );
}

export default Page;
