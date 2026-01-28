"use client";

import Link from "next/link";
import Image from "next/image";
import { CreditBalance } from "@/components/ui/CreditBalance";

/**
 * Header principal do dashboard
 * Contém logo, saldo de créditos e link para conta
 */
export function DashboardHeader() {

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
