"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
export default function CopyEmailButton({ email, label, copied, failed }: { email: string; label: string; copied: string; failed: string }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  return <div className="relative"><Button variant="outline" onClick={async () => {
    setStatus("idle");
    try { await navigator.clipboard.writeText(email); setStatus("success"); } catch { setStatus("error"); }
  }}>{label}</Button>{status === "success" && <span aria-hidden="true" className="portfolio-copy-ring" />}<p aria-live="polite" className="text-sm mt-2">{status === "success" ? copied : status === "error" ? failed : ""}</p></div>;
}
