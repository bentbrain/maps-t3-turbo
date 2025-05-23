import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();
  if (user) {
    redirect(`/${user.id}`);
  }
  return (
    <main className="grid h-dvh w-full place-items-center">
      <div className="flex h-full w-full items-center justify-center p-4">
        <SignUp />
      </div>
    </main>
  );
}
