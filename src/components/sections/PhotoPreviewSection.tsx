"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { pickLocalized } from "@/lib/content-overrides";
import type { PhotoItem } from "@/lib/types";
export interface PhotoPreviewSectionProps { photography: PhotoItem[] }
export default function PhotoPreviewSection({ photography }: PhotoPreviewSectionProps) {
  const { t, locale } = useTranslation();
  const reduced = useReducedMotion();
  const strip = useRef<HTMLDivElement>(null);
  const featured = photography.filter((photo) => photo.featured);
  const photos = (featured.length ? featured : photography).slice(0, 4);
  useEffect(() => {
    const element = strip.current;
    if (!element || reduced) return;
    let visible = false; let frame = 0;
    const update = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      const rect = element.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - rect.top - rect.height / 2) / window.innerHeight));
      element.querySelectorAll<HTMLElement>("[data-photo-parallax]").forEach((item, i) => { item.style.transform = `translateY(${progress * (8 + i * 16 / 3)}px)`; });
    };
    const schedule = () => { if (visible && !document.hidden && !frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; } });
    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", schedule); element.querySelectorAll<HTMLElement>("[data-photo-parallax]").forEach((item) => { item.style.transform = ""; }); };
  }, [reduced, photography]);
  if (!photos.length) return null;
  return <section id="photos" className="portfolio-section"><div className="portfolio-column">
    <div className="portfolio-reveal portfolio-reveal--sweep text-center mb-10"><SectionHeading>{t("photoPreview.titlePrefix")}{t("photoPreview.titleHighlight")}</SectionHeading><p className="text-portfolio-dust">{t("photoPreview.subtitle")}</p></div>
    <div ref={strip} className="portfolio-photo-strip">{photos.map((photo, i) => {
      const title = pickLocalized(locale, photo.title, photo.title_vi) || `${t("photoPreview.photoLabel")} ${i + 1}`;
      return <Link key={photo.id} href="/photography" className="portfolio-reveal portfolio-reveal--iris relative block aspect-[4/5] overflow-hidden snap-start" aria-label={title}>
        <div data-photo-parallax className="absolute -inset-y-6 inset-x-0"><Image src={photo.image} alt={title} fill sizes="(max-width: 639px) 78vw, (max-width: 1120px) 25vw, 268px" className="object-cover" /></div>
      </Link>;
    })}</div>
    <div className="portfolio-reveal mt-8 text-center"><Link className="portfolio-text-link" href="/photography">{t("photoPreview.viewAll")}</Link></div>
  </div></section>;
}
