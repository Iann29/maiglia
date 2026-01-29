"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loading } from "@/components/ui/Loading";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <Loading />;
  }

  if (session) {
    return null;
  }

  return (
    <main className="min-h-screen p-8">
      <Link href="/" className="fixed top-[9px] left-1/2 -translate-x-1/2 z-50">
        <Image
          src="/maiglia.svg"
          alt="Maiglia"
          width={80}
          height={80}
          priority
        />
      </Link>
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Maiglia</h1>

        <div className="space-y-4">
          <p className="text-gray-500">Bem-vindo ao Maiglia.</p>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-accent/10 rounded-lg transition-colors"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
