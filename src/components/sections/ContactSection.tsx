"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInView } from "framer-motion";
import dynamic from "next/dynamic";
import { AnimatedSection, GlassCard, Button } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { cn } from "@/lib/utils";
import { resolveSectionText } from "@/lib/content-overrides";
import type { SiteConfig } from "@/lib/types";
import { brand, gap, radius, text } from "@/lib/design-tokens";

// Dynamic imports for 3D components
const SceneContainer = dynamic(
  () => import("@/components/3d/SceneContainer"),
  { ssr: false }
);

const ParticleField = dynamic(
  () => import("@/components/3d/ParticleField"),
  { ssr: false }
);

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactSectionProps {
  siteConfig: SiteConfig;
}

export default function ContactSection({ siteConfig }: ContactSectionProps) {
  const { t, locale } = useTranslation();
  const contact = siteConfig.sectionsContent?.contact;
  const [isMounted, setIsMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  // Only mount the WebGL canvas once the section is about to scroll into
  // view — avoids a 3rd concurrent Canvas running from page load while the
  // visitor is still looking at the Hero section above.
  const isNearView = useInView(sectionRef, { once: true, margin: "200px" });
  const performanceTier = usePerformanceTier();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const contactSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(
            2,
            resolveSectionText(
              locale,
              contact?.validation?.nameMin,
              contact?.validation?.nameMin_vi,
              t("contact.validation.nameMin")
            )
          ),
        email: z
          .string()
          .email(
            resolveSectionText(
              locale,
              contact?.validation?.emailValid,
              contact?.validation?.emailValid_vi,
              t("contact.validation.emailValid")
            )
          ),
        subject: z
          .string()
          .min(
            5,
            resolveSectionText(
              locale,
              contact?.validation?.subjectMin,
              contact?.validation?.subjectMin_vi,
              t("contact.validation.subjectMin")
            )
          ),
        message: z
          .string()
          .min(
            20,
            resolveSectionText(
              locale,
              contact?.validation?.messageMin,
              contact?.validation?.messageMin_vi,
              t("contact.validation.messageMin")
            )
          ),
      }),
    [t, locale, contact]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // One outcome at a time, rather than three separately-updated booleans/
  // strings that could otherwise drift (e.g. a stale errorMessage/
  // submittedData surviving into a later successful submit).
  type FormState =
    | { status: "idle" }
    | { status: "success" }
    | { status: "error"; message: string; data: ContactFormData };
  const [formState, setFormState] = useState<FormState>({ status: "idle" });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The honeypot field lives outside react-hook-form (it must stay
        // empty for real users) — read it straight from the form element.
        body: JSON.stringify({
          ...data,
          website: honeypotRef.current?.value,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setFormState({
          status: "error",
          data,
          message:
            response.status === 429
              ? resolveSectionText(locale, contact?.errorRateLimited, contact?.errorRateLimited_vi, t("contact.errorRateLimited"))
              : body.error ||
                resolveSectionText(locale, contact?.errorGeneric, contact?.errorGeneric_vi, t("contact.errorGeneric")),
        });
        return;
      }

      setFormState({ status: "success" });
      reset();
    } catch {
      setFormState({
        status: "error",
        data,
        message: resolveSectionText(locale, contact?.errorGeneric, contact?.errorGeneric_vi, t("contact.errorGeneric")),
      });
    }
  };

  const mailtoHref =
    formState.status === "error"
      ? `mailto:${siteConfig.author.email}?subject=${encodeURIComponent(
        formState.data.subject
      )}&body=${encodeURIComponent(
        `${formState.data.message}\n\n— ${formState.data.name} (${formState.data.email})`
      )}`
      : undefined;

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative pt-8 pb-32 overflow-hidden"
    >
      {/* 3D Particle Background */}
      {isMounted && isNearView && (
        <div className="absolute inset-0 opacity-40">
          <SceneContainer>
            <ambientLight intensity={0.5} />
            <ParticleField
              count={performanceTier === "low" ? 200 : 500}
              color="#8b5cf6"
              size={0.02}
              spread={25}
            />
          </SceneContainer>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-cyan-500 light:text-cyan-700 font-medium tracking-wider uppercase mb-4 block">
              {resolveSectionText(locale, contact?.badge, contact?.badge_vi, t("contact.badge"))}
            </span>
            <h2 className={cn("text-4xl md:text-5xl font-bold", text.primary, "mb-6")}>
              {resolveSectionText(locale, contact?.titlePrefix, contact?.titlePrefix_vi, t("contact.titlePrefix"))}
              <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                {resolveSectionText(locale, contact?.titleHighlight, contact?.titleHighlight_vi, t("contact.titleHighlight"))}
              </span>
            </h2>
            <p className="text-white/60 light:text-neutral-500 max-w-2xl mx-auto">
              {resolveSectionText(locale, contact?.subtitle, contact?.subtitle_vi, t("contact.subtitle"))}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <AnimatedSection>
            <GlassCard className="p-8">
              {formState.status !== "idle" && (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "mb-6 p-4 rounded-xl border text-sm text-white/80 light:text-neutral-700",
                    formState.status === "success"
                      ? "border-green-500/30 bg-green-500/10 light:border-green-500/40"
                      : "border-red-500/30 bg-red-500/10 light:border-red-500/40"
                  )}
                >
                  {formState.status === "success" ? (
                    <>
                      <p className={cn("font-medium", text.primary)}>
                        {resolveSectionText(locale, contact?.successTitle, contact?.successTitle_vi, t("contact.successTitle"))}
                      </p>
                      <p className="mt-1">
                        {resolveSectionText(locale, contact?.successMessage, contact?.successMessage_vi, t("contact.successMessage"))}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>{formState.message}</p>
                      <p className="mt-2">
                        {resolveSectionText(locale, contact?.unconnectedNotice, contact?.unconnectedNotice_vi, t("contact.unconnectedNotice"))}{" "}
                        {resolveSectionText(locale, contact?.mailtoPrefix, contact?.mailtoPrefix_vi, t("contact.mailtoPrefix"))}
                        <a
                          href={mailtoHref}
                          className="text-cyan-400 light:text-cyan-700 underline hover:text-cyan-300 light:hover:text-cyan-800"
                        >
                          {resolveSectionText(locale, contact?.mailtoLinkText, contact?.mailtoLinkText_vi, t("contact.mailtoLinkText"))}
                        </a>
                        {resolveSectionText(locale, contact?.mailtoSuffix, contact?.mailtoSuffix_vi, t("contact.mailtoSuffix"))}
                        <a
                          href={`mailto:${siteConfig.author.email}`}
                          className="text-cyan-400 light:text-cyan-700 underline hover:text-cyan-300 light:hover:text-cyan-800"
                        >
                          {siteConfig.author.email}
                        </a>
                        .
                      </p>
                    </>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Honeypot: hidden from sighted/keyboard users, bots that
                    fill every field they find will trip it. */}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] w-px h-px opacity-0"
                />
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-white/70 light:text-neutral-600 mb-2"
                  >
                    {resolveSectionText(locale, contact?.nameLabel, contact?.nameLabel_vi, t("contact.nameLabel"))}
                  </label>
                  <input
                    {...register("name")}
                    id="contact-name"
                    type="text"
                    placeholder={resolveSectionText(locale, contact?.namePlaceholder, contact?.namePlaceholder_vi, t("contact.namePlaceholder"))}
                    aria-invalid={!!errors.name}
                    aria-describedby={
                      errors.name ? "contact-name-error" : undefined
                    }
                    className={cn("w-full px-4 py-3 bg-white/5 light:bg-neutral-900/[0.03] border border-white/10 light:border-neutral-900/15", radius.control, text.primary, "placeholder:text-white/40 light:placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all")}
                  />
                  {errors.name && (
                    <p
                      id="contact-name-error"
                      className="mt-1 text-sm text-red-400 light:text-red-600"
                    >
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-white/70 light:text-neutral-600 mb-2"
                  >
                    {resolveSectionText(locale, contact?.emailLabel, contact?.emailLabel_vi, t("contact.emailLabel"))}
                  </label>
                  <input
                    {...register("email")}
                    id="contact-email"
                    type="email"
                    placeholder={resolveSectionText(locale, contact?.emailPlaceholder, contact?.emailPlaceholder_vi, t("contact.emailPlaceholder"))}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? "contact-email-error" : undefined
                    }
                    className={cn("w-full px-4 py-3 bg-white/5 light:bg-neutral-900/[0.03] border border-white/10 light:border-neutral-900/15", radius.control, text.primary, "placeholder:text-white/40 light:placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all")}
                  />
                  {errors.email && (
                    <p
                      id="contact-email-error"
                      className="mt-1 text-sm text-red-400 light:text-red-600"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-sm font-medium text-white/70 light:text-neutral-600 mb-2"
                  >
                    {resolveSectionText(locale, contact?.subjectLabel, contact?.subjectLabel_vi, t("contact.subjectLabel"))}
                  </label>
                  <input
                    {...register("subject")}
                    id="contact-subject"
                    type="text"
                    placeholder={resolveSectionText(locale, contact?.subjectPlaceholder, contact?.subjectPlaceholder_vi, t("contact.subjectPlaceholder"))}
                    aria-invalid={!!errors.subject}
                    aria-describedby={
                      errors.subject ? "contact-subject-error" : undefined
                    }
                    className={cn("w-full px-4 py-3 bg-white/5 light:bg-neutral-900/[0.03] border border-white/10 light:border-neutral-900/15", radius.control, text.primary, "placeholder:text-white/40 light:placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all")}
                  />
                  {errors.subject && (
                    <p
                      id="contact-subject-error"
                      className="mt-1 text-sm text-red-400 light:text-red-600"
                    >
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-white/70 light:text-neutral-600 mb-2"
                  >
                    {resolveSectionText(locale, contact?.messageLabel, contact?.messageLabel_vi, t("contact.messageLabel"))}
                  </label>
                  <textarea
                    {...register("message")}
                    id="contact-message"
                    rows={5}
                    placeholder={resolveSectionText(locale, contact?.messagePlaceholder, contact?.messagePlaceholder_vi, t("contact.messagePlaceholder"))}
                    aria-invalid={!!errors.message}
                    aria-describedby={
                      errors.message ? "contact-message-error" : undefined
                    }
                    className={cn("w-full px-4 py-3 bg-white/5 light:bg-neutral-900/[0.03] border border-white/10 light:border-neutral-900/15", radius.control, text.primary, "placeholder:text-white/40 light:placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none")}
                  />
                  {errors.message && (
                    <p
                      id="contact-message-error"
                      className="mt-1 text-sm text-red-400 light:text-red-600"
                    >
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? resolveSectionText(locale, contact?.sendingButton, contact?.sendingButton_vi, t("contact.sendingButton"))
                    : resolveSectionText(locale, contact?.sendButton, contact?.sendButton_vi, t("contact.sendButton"))}
                </Button>
              </form>
            </GlassCard>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection delay={0.2}>
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className={cn("flex items-start", gap.loose)}>
                  <div className={cn("w-12 h-12", radius.control, brand.gradient, "flex items-center justify-center flex-shrink-0")}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={cn("text-lg font-semibold", text.primary, "mb-1")}>
                      {resolveSectionText(locale, contact?.emailInfo, contact?.emailInfo_vi, t("contact.emailInfo"))}
                    </h3>
                    <a
                      href={`mailto:${siteConfig.author.email}`}
                      className={cn("text-white/60 light:text-neutral-500", text.mutedHover, "transition-colors")}
                    >
                      {siteConfig.author.email}
                    </a>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className={cn("flex items-start", gap.loose)}>
                  <div className={cn("w-12 h-12", radius.control, "bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0")}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={cn("text-lg font-semibold", text.primary, "mb-1")}>
                      {resolveSectionText(locale, contact?.locationInfo, contact?.locationInfo_vi, t("contact.locationInfo"))}
                    </h3>
                    <p className="text-white/60 light:text-neutral-500">
                      {locale === "vi" && siteConfig.author.location_vi ? siteConfig.author.location_vi : siteConfig.author.location}
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className={cn("flex items-start", gap.loose)}>
                  <div className={cn("w-12 h-12", radius.control, "bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0")}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={cn("text-lg font-semibold", text.primary, "mb-1")}>
                      {resolveSectionText(locale, contact?.availabilityInfo, contact?.availabilityInfo_vi, t("contact.availabilityInfo"))}
                    </h3>
                    <p className="text-white/60 light:text-neutral-500">
                      {resolveSectionText(locale, contact?.workHours, contact?.workHours_vi, t("contact.workHours"))}
                    </p>
                    <p className="text-green-500 text-sm mt-1 flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5", radius.pill, "bg-green-500")} />
                      {resolveSectionText(locale, contact?.openForProjects, contact?.openForProjects_vi, t("contact.openForProjects"))}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
