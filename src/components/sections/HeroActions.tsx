"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ActionStars from "@/components/ui/ActionStars";

const CVPreviewModal = dynamic(() => import("@/components/ui/CVPreviewModal"), { ssr: false });
export default function HeroActions({ resumeUrl, viewWork, viewCV }: {
  resumeUrl: string | null; viewWork: string; viewCV: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);
  if (!viewWork && !(resumeUrl && viewCV)) return null;
  return <>
    <div className="portfolio-hero-actions mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      {viewWork && <a href="#projects" className="portfolio-action portfolio-action-primary inline-flex min-h-12 items-center justify-center px-6 py-3 font-semibold"><ActionStars />{viewWork}</a>}
      {resumeUrl && viewCV && <a ref={triggerRef} href={resumeUrl} onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        setOpen(true);
      }} className="portfolio-action portfolio-action-secondary inline-flex min-h-12 items-center justify-center border border-portfolio-control px-6 py-3 font-semibold">{viewCV}</a>}
    </div>
    {open && resumeUrl && <CVPreviewModal url={resumeUrl} isOpen={open} onClose={close} />}
  </>;
}
