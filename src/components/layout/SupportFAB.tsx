"use client";

import { Coffee } from "lucide-react";

interface SupportFABProps {
  onClick: () => void;
  /** Hide the FAB (e.g. while a mobile drawer/sheet is open). */
  hidden?: boolean;
}

/**
 * Circular "Buy me a coffee" floating action button — a compact 44px disc
 * tucked into the bottom-right corner. A label pill slides out on hover
 * (desktop) so the disc itself stays clean and uncluttered.
 */
export function SupportFAB({ onClick, hidden = false }: SupportFABProps) {
  if (hidden) return null;
  return (
    <div className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2">
      {/* Hover label pill (desktop only) */}
      <span className="pointer-events-none hidden translate-x-1 rounded-full border border-zinc-700/80 bg-zinc-900/95 px-2.5 py-1 text-[11px] font-medium text-zinc-200 opacity-0 shadow-lg backdrop-blur transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:block">
        Buy me a coffee
      </span>

      <button
        onClick={onClick}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-zinc-950 shadow-md shadow-cyan-500/25 ring-1 ring-inset ring-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40 active:translate-y-0 active:scale-95"
        title="Buy me a coffee — support the project"
        aria-label="Buy me a coffee"
      >
        {/* Soft glow ring that blooms on hover */}
        <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-cyan-400/0 ring-offset-0 ring-offset-transparent transition-all duration-300 group-hover:ring-cyan-400/30 group-hover:ring-offset-2" />
        <Coffee
          className="h-[18px] w-[18px] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}
