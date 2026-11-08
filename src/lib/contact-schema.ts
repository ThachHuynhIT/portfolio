import { z } from "zod";

// The one schema for the public contact form's real fields. The honeypot
// field is deliberately NOT here — it's validated separately by the route
// handler, since a filled honeypot must short-circuit before any of this
// runs.
// Shared with ContactForm so the browser never accepts what the API rejects.
export const CONTACT_MAX_LENGTH = { name: 100, email: 200, subject: 150, message: 2000 } as const;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(CONTACT_MAX_LENGTH.name),
  email: z.string().trim().email("Must be a valid email").max(CONTACT_MAX_LENGTH.email),
  subject: z
    .union([z.literal(""), z.string().trim().max(CONTACT_MAX_LENGTH.subject)])
    .optional()
    .transform((value) => (value ? value : null)),
  message: z.string().trim().min(1, "Message is required").max(CONTACT_MAX_LENGTH.message),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessageOutput = z.output<typeof contactMessageSchema>;
