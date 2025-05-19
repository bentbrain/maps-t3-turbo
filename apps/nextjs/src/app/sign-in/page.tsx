import { SignIn } from "@clerk/nextjs";
import React from "react";

function Page() {
  return (
    <main className="grid place-items-center h-dvh">
      <SignIn />
    </main>
  );
}

export default Page;
