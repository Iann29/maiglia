"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/Loading";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    if (typeof window !== "undefined") {
      const justLoggedIn = sessionStorage.getItem("maiglia-just-logged-in");
      if (justLoggedIn) {
        sessionStorage.removeItem("maiglia-just-logged-in");
        return null;
      }
    }
    return <Loading />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <DashboardHeader />
      <main className="fixed top-14 left-0 right-0 bottom-0 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </>
  );
}
