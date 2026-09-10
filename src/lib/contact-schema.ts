import { z } from "zod";

// The one schema for the public contact form's real fields. The honeypot
// field is deliberately NOT here — it's validated separately by the route
// handler, since a filled honeypot must short-circuit before any of this
// runs.
export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Must be a valid email").max(200),
  subject: z
    .union([z.literal(""), z.string().trim().max(150)])
    .optional()
    .transform((value) => (value ? value : null)),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactMessageOutput = z.output<typeof contactMessageSchema>;
