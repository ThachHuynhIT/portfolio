"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const ContraGame = dynamic(() => import("@/components/game/ContraGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full max-w-[800px] aspect-[800/480] mx-auto bg-black border-2 border-gray-700 rounded-lg">
      <div className="text-center">
        <p className="text-red-500 text-2xl font-mono font-bold animate-pulse">LOADING...</p>
        <p className="text-gray-500 text-sm font-mono mt-2">Preparing battlefield</p>
      </div>
    </div>
  ),
});

export default function ContraPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-red-500 text-2xl font-mono font-bold animate-pulse">LOADING...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto px-4 py-2 bg-gray-800/80 backdrop-blur text-gray-300 rounded-lg text-sm font-mono hover:bg-gray-700 transition-colors border border-gray-700"
        >
          ← {t("common.backToPortfolio")}
        </Link>
        <div className="pointer-events-auto">
          <LanguageSwitcher variant="pill" size="sm" />
        </div>
      </div>
      <ContraGame />
    </div>
  );
}
