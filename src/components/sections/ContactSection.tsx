"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import { AnimatedSection, GlassCard, Button } from "@/components/ui";
import { siteConfig } from "@/lib/constants";

// Dynamic imports for 3D components
const SceneContainer = dynamic(
  () => import("@/components/3d/SceneContainer"),
  { ssr: false }
);

const ParticleField = dynamic(
  () => import("@/components/3d/ParticleField"),
  { ssr: false }
);

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactSection() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(
    null
  );

  const onSubmit = async (data: ContactFormData) => {
    setSubmittedData(data);
    reset();
  };

  const mailtoHref = submittedData
    ? `mailto:${siteConfig.author.email}?subject=${encodeURIComponent(
        submittedData.subject
      )}&body=${encodeURIComponent(
        `${submittedData.message}\n\n— ${submittedData.name} (${submittedData.email})`
      )}`
    : undefined;

  return (
    <section id="contact" className="relative py-32 overflow-hidden">
      {/* 3D Particle Background */}
      {isMounted && (
        <div className="absolute inset-0 opacity-40">
          <SceneContainer>
            <ambientLight intensity={0.5} />
            <ParticleField count={500} color="#8b5cf6" size={0.02} spread={25} />
          </SceneContainer>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-sm text-cyan-500 font-medium tracking-wider uppercase mb-4 block">
              Get in Touch
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Let&apos;s Work{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                Together
              </span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Have a project in mind? I&apos;d love to hear about it. Drop me a message
              and let&apos;s create something amazing together.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <AnimatedSection>
            <GlassCard className="p-8">
              {submittedData && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mb-6 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-sm text-white/80"
                >
                  <p>
                    This form isn&apos;t connected to a live inbox yet, so
                    nothing was sent automatically.
                  </p>
                  <p className="mt-2">
                    Please{" "}
                    <a
                      href={mailtoHref}
                      className="text-cyan-400 underline hover:text-cyan-300"
                    >
                      click here to send it via your email client
                    </a>{" "}
                    instead, or reach me directly at{" "}
                    <a
                      href={`mailto:${siteConfig.author.email}`}
                      className="text-cyan-400 underline hover:text-cyan-300"
                    >
                      {siteConfig.author.email}
                    </a>
                    .
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Name
                  </label>
                  <input
                    {...register("name")}
                    id="contact-name"
                    type="text"
                    placeholder="John Doe"
                    aria-invalid={!!errors.name}
                    aria-describedby={
                      errors.name ? "contact-name-error" : undefined
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  {errors.name && (
                    <p
                      id="contact-name-error"
                      className="mt-1 text-sm text-red-400"
                    >
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Email
                  </label>
                  <input
                    {...register("email")}
                    id="contact-email"
                    type="email"
                    placeholder="john@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? "contact-email-error" : undefined
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  {errors.email && (
                    <p
                      id="contact-email-error"
                      className="mt-1 text-sm text-red-400"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Subject
                  </label>
                  <input
                    {...register("subject")}
                    id="contact-subject"
                    type="text"
                    placeholder="Project Inquiry"
                    aria-invalid={!!errors.subject}
                    aria-describedby={
                      errors.subject ? "contact-subject-error" : undefined
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  {errors.subject && (
                    <p
                      id="contact-subject-error"
                      className="mt-1 text-sm text-red-400"
                    >
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    {...register("message")}
                    id="contact-message"
                    rows={5}
                    placeholder="Tell me about your project..."
                    aria-invalid={!!errors.message}
                    aria-describedby={
                      errors.message ? "contact-message-error" : undefined
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                  />
                  {errors.message && (
                    <p
                      id="contact-message-error"
                      className="mt-1 text-sm text-red-400"
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
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </GlassCard>
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection delay={0.2}>
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Email</h3>
                    <a
                      href={`mailto:${siteConfig.author.email}`}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {siteConfig.author.email}
                    </a>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Location</h3>
                    <p className="text-white/60">{siteConfig.author.location}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Availability</h3>
                    <p className="text-white/60">Mon - Fri, 9AM - 6PM PST</p>
                    <p className="text-green-500 text-sm mt-1">● Open for projects</p>
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
