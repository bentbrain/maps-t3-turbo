import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DatabaseList } from "@/components/database-list";
import { prefetch, trpc } from "@/trpc/server";
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
      <main className="disable-layout-features grid w-full place-items-center">
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

  prefetch(trpc.user.getUserDatabasesFromNotion.queryOptions());

  return <DatabaseList userId={userId} />;
};

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid h-dvh w-full grid-rows-[auto_1fr]">
      <header className="bg-background p-3">
        <div className="ml-auto flex w-full justify-end">
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
