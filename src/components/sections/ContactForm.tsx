"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { resolveRequiredText } from "@/lib/content-overrides";
import type { ContactSectionContent } from "@/lib/types";
type Fields = { name: string; email: string; subject: string; message: string };
export default function ContactForm({ contact, email }: { contact?: ContactSectionContent; email: string }) {
  const { t, locale } = useTranslation();
  const card = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const required = (key: "nameLabel" | "emailLabel" | "subjectLabel" | "messageLabel" | "sendButton" | "sendingButton" | "successMessage" | "errorGeneric") => resolveRequiredText(locale, contact?.[key], contact?.[`${key}_vi`], t(`contact.${key}`));
  const schema = useMemo(() => {
    const message = (key: "nameMin" | "emailValid" | "subjectMin" | "messageMin") => resolveRequiredText(locale, contact?.validation?.[key], contact?.validation?.[`${key}_vi`], t(`contact.validation.${key}`));
    return z.object({ name: z.string().min(2, message("nameMin")), email: z.string().email(message("emailValid")), subject: z.string().min(5, message("subjectMin")), message: z.string().min(20, message("messageMin")) });
  }, [contact, locale, t]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Fields>({ resolver: zodResolver(schema) });
  useEffect(() => {
    const element = card.current; if (!element) return;
    let visible = false;
    const update = () => { element.dataset.starsActive = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element); document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  const submit = async (data: Fields) => {
    if (busy.current) return;
    busy.current = true; setStatus("pending");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, website: honeypot.current?.value ?? "" }) });
      if (!response.ok) throw new Error("Contact request failed");
      setStatus("success"); reset();
    } catch { setStatus("error"); } finally { busy.current = false; }
  };
  return <div ref={card} data-stars-active="false" data-signal={status} className="portfolio-contact-card portfolio-solid">
    <div aria-hidden="true" className="bg-stars portfolio-contact-stars">{Array.from({ length: 5 }, (_, i) => <span className="star" key={i} />)}</div>
    <div className="portfolio-contact-content">
      <div aria-live="polite" className="mb-4">{status === "success" ? required("successMessage") : status === "pending" ? required("sendingButton") : status === "error" ? <>{required("errorGeneric")} {email && <a className="portfolio-text-link" href={`mailto:${email}`}>{email}</a>}</> : ""}</div>
      <form onSubmit={handleSubmit(submit)} className="space-y-5" aria-busy={isSubmitting}>
        <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
        {(["name", "email", "subject", "message"] as const).map((field) => {
          const props = { ...register(field), id: `contact-${field}`, "aria-invalid": Boolean(errors[field]), "aria-describedby": errors[field] ? `contact-${field}-error` : undefined, className: "portfolio-input" };
          return <div key={field}><label htmlFor={`contact-${field}`} className="block mb-2">{required(`${field}Label`)}</label>
            {field === "message" ? <textarea {...props} rows={5} /> : <input {...props} type={field === "email" ? "email" : "text"} autoComplete={field === "name" ? "name" : field === "email" ? "email" : undefined} />}
            {errors[field] && <p id={`contact-${field}-error`} className="text-sm mt-1">{errors[field]?.message}</p>}
          </div>;
        })}
        <div className="portfolio-signal relative"><Button type="submit" disabled={isSubmitting || status === "pending"} className="w-full portfolio-action-contained">{status === "pending" ? required("sendingButton") : required("sendButton")}</Button>{[0, 1, 2].map((ring) => <span key={ring} aria-hidden="true" className="portfolio-signal-ring" style={{ animationDelay: `${ring * .4}s` }} />)}{status === "success" && <span aria-hidden="true" className="portfolio-signal-check">✓</span>}</div>
      </form>
    </div>
  </div>;
}
