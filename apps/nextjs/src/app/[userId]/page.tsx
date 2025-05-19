import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DatabaseList } from "@/components/database-list";
import { prefetch, trpc } from "@/trpc/server";
import { auth } from "@clerk/nextjs/server";
import { Loader2 } from "lucide-react";

function Page({ params }: { params: Promise<{ userId: string }> }) {
  return (
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
