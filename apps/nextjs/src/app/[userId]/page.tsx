import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DatabaseList } from "@/components/database-list";
import { caller } from "@/trpc/server";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Loader2 } from "lucide-react";

function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <PageLayout>
      <main className="grid w-full place-items-center">
        <div className="flex h-full w-full items-center justify-center p-4">
          <Suspense
            fallback={
              <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
            }
          >
            <DynamicParts params={params} />
          </Suspense>
        </div>
      </main>
    </PageLayout>
  );
}

export default Page;

const DynamicParts = async ({
  params,
}: {
  params: Promise<{ userId: string }>;
}) => {
  const { userId } = await params;
  const { userId: clerkUserId } = await auth();

  if (userId !== clerkUserId) {
    redirect(`/`);
  }
  const databases = await caller.user.getUserDatabasesFromNotion();

  if (databases.length === 1) {
    redirect(`/${userId}/${databases[0]?.id}`);
  }

  return <DatabaseList databases={databases} userId={userId} />;
};

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid h-dvh w-full grid-rows-[auto_1fr]">
      <header className="bg-background p-3">
        <div className="ml-auto flex min-h-9 w-full justify-end">
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      {children}
    </div>
  );
};
