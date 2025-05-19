import { SignIn } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();
  if (user) {
    redirect(`/${user.id}`);
  }
  return (
    <main className="w-full h-dvh grid place-items-center">
      <div className="w-full h-full flex items-center justify-center p-4">
        <SignIn />
      </div>
    </main>
  );
}
