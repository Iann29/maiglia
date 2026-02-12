"use client";

import Link from "next/link";
import Image from "next/image";
import { Id } from "../../../convex/_generated/dataModel";
import { CreditBalance } from "@/components/ui/CreditBalance";
import { WorkspaceTabs } from "@/components/layout/WorkspaceTabs";
import { useSession } from "@/lib/auth-client";

interface Workspace {
  _id: Id<"workspaces">;
  name: string;
  color: string;
  index: string;
}

interface DashboardHeaderProps {
  workspaces: Workspace[];
  activeWorkspaceId: Id<"workspaces"> | null;
  onSelectWorkspace: (id: Id<"workspaces">) => void;
}

export function DashboardHeader({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
}: DashboardHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-bg-primary z-50 flex items-center gap-3 px-4">
      <Link href="/" className="shrink-0">
        <Image
          src="/maiglia.svg"
          alt="Maiglia"
          width={80}
          height={40}
          priority
        />
      </Link>

      <div className="flex-1 min-w-0 overflow-hidden">
        <WorkspaceTabs
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelect={onSelectWorkspace}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <CreditBalance />

        <Link
          href="/minha-conta"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-tertiary border border-border-primary transition-colors overflow-hidden"
          title="Minha Conta"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-fg-secondary"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
            </svg>
          )}
        </Link>
      </div>
    </header>
  );
}
