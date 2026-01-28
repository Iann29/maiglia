"use client";

import Link from "next/link";
import Image from "next/image";
import { CreditBalance } from "@/components/ui/CreditBalance";

interface DashboardHeaderProps {
  onAddNode?: () => void;
}

/**
 * Header principal do dashboard
 * Contém logo, botão de adicionar node e link para conta
 */
export function DashboardHeader({ onAddNode }: DashboardHeaderProps) {

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-bg-primary border-b border-border-primary z-50 flex items-center justify-between px-4">
      <Link href="/">
        <Image
          src="/maiglia.svg"
          alt="Maiglia"
          width={80}
          height={40}
          priority
        />
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddNode}
          disabled={!onAddNode}
          className="px-3 py-2 bg-accent hover:bg-accent-hover text-accent-fg text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Adicionar Bloco
        </button>

        <CreditBalance />

        <Link
          href="/minha-conta"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-tertiary border border-border-primary transition-colors"
          title="Minha Conta"
        >
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
        </Link>
      </div>
    </header>
  );
}
