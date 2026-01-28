"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";

interface ToastMessage {
  id: number;
  amount: number;
}

let toastIdCounter = 0;

/**
 * Componente que detecta quando créditos aumentam e mostra toast.
 * Monitora saldo via useQuery e compara com valor anterior.
 */
export function CreditToast() {
  const result = useQuery(api.credits.queries.get);
  const prevBalanceRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const balance = result?.balance;

  useEffect(() => {
    // Ignora se ainda carregando
    if (balance === undefined) return;

    // Na primeira vez que recebe o saldo, apenas armazena
    if (isFirstRenderRef.current) {
      prevBalanceRef.current = balance;
      isFirstRenderRef.current = false;
      return;
    }

    // Se o saldo aumentou, mostra toast
    if (prevBalanceRef.current !== null && balance > prevBalanceRef.current) {
      const gained = balance - prevBalanceRef.current;
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, amount: gained }]);

      // Auto-dismiss após 3s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }

    prevBalanceRef.current = balance;
  }, [balance]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-200 text-sm font-medium animate-slide-in-toast"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12" />
            <path d="M8 10h8" />
            <path d="M8 14h8" />
          </svg>
          +{toast.amount} créditos!
        </div>
      ))}
    </div>
  );
}
