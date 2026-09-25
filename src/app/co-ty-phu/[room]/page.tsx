"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSavedName, saveName } from "@/components/games/gameClient";
import { NameForm } from "@/components/tienlen/NameForm";

const TyPhuTable = dynamic(() => import("@/components/typhu/TyPhuTable"), {
  ssr: false,
  loading: () => <p className="animate-pulse pt-32 text-center text-sky-100/70">Đang tải bàn chơi…</p>,
});

export default function CoTyPhuRoomPage({ params }: { params: { room: string } }) {
  const code = decodeURIComponent(params.room).toUpperCase();
  const watch = useSearchParams().get("watch") === "1";
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
        <Link href="/co-ty-phu" className="mb-6 self-start text-sm text-sky-100/70 hover:text-sky-50">
          ← Sảnh
        </Link>
        <h1 className="mb-1 text-2xl font-black text-amber-300">
          {watch ? "Xem" : "Vào"} bàn {code}
        </h1>
        <p className="mb-5 text-sm text-sky-100/70">Nhập tên để mọi người nhận ra bạn.</p>
        <NameForm
          initial=""
          submitLabel={watch ? "Vào xem" : "Vào bàn"}
          onSubmit={(n) => {
            saveName(n);
            setName(n);
          }}
        />
      </main>
    );
  }

  return <TyPhuTable code={code} name={name} watch={watch} />;
}
