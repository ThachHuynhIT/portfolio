"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { NameForm } from "@/components/tienlen/NameForm";
import { getSavedName, saveName } from "@/components/tienlen/useTienLen";

const TienLenTable = dynamic(() => import("@/components/tienlen/TienLenTable"), {
  ssr: false,
  loading: () => <p className="pt-32 text-center text-emerald-100/70 animate-pulse">Đang tải bàn chơi…</p>,
});

export default function TienLenRoomPage({ params }: { params: { room: string } }) {
  const code = decodeURIComponent(params.room).toUpperCase();
  const [saved, setSaved] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const n = getSavedName();
    setSaved(n);
    if (n) setName(n);
  }, []);

  if (saved === null) return null;

  if (!name) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-4">
        <h1 className="mb-1 text-2xl font-black text-amber-300">Vào phòng {code}</h1>
        <p className="mb-5 text-sm text-emerald-100/70">Nhập tên để mọi người nhận ra bạn.</p>
        <NameForm
          initial=""
          submitLabel="Vào bàn"
          onSubmit={(n) => {
            saveName(n);
            setName(n);
          }}
        />
      </main>
    );
  }

  return <TienLenTable code={code} name={name} />;
}
