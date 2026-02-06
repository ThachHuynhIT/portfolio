"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect } from "react";

const ContraGame = dynamic(() => import("@/components/game/ContraGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-[800px] h-[480px] bg-black border-2 border-gray-700 rounded-lg">
      <div className="text-center">
        <p className="text-red-500 text-2xl font-mono font-bold animate-pulse">LOADING...</p>
        <p className="text-gray-500 text-sm font-mono mt-2">Preparing battlefield</p>
      </div>
    </div>
  ),
});

export default function ContraPage() {
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
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-800/80 backdrop-blur text-gray-300 rounded-lg text-sm font-mono hover:bg-gray-700 transition-colors border border-gray-700"
        >
          ← Back to Portfolio
        </Link>
      </div>
      <ContraGame />
    </div>
  );
}
