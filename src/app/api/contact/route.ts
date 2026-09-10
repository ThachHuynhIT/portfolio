import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { contactMessageSchema } from "@/lib/contact-schema";
import { createContactMessage } from "@/lib/content/contact-messages";

// Public, unauthenticated write endpoint — keyed by IP instead of email,
// since there's no account to key off of.
const rateLimiter = createRateLimiter({ max: 3, windowMs: 60 * 60 * 1000 });

const NOTIFICATION_FROM = "Portfolio Contact <onboarding@resend.dev>";
const NOTIFICATION_SUBJECT = "New message from your portfolio contact form";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    if (rateLimiter.isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages sent. Please try again later." },
        { status: 429 }
      );
    }
    rateLimiter.recordAttempt(ip);

    const body = await request.json();

    // A filled honeypot means a bot filled every field it could find.
    // Report success without touching the DB or Resend — never reveal
    // detection.
    if (typeof body.website === "string" && body.website.length > 0) {
      return NextResponse.json({ success: true });
    }

    const parsed = contactMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    await createContactMessage(parsed.data);

    // A Resend failure must never look like a lost message to the visitor —
    // the record above is already saved. Log and move on rather than
    // surfacing an error for something the visitor did nothing wrong on.
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: NOTIFICATION_FROM,
        to: process.env.CONTACT_NOTIFICATION_EMAIL!,
        subject: NOTIFICATION_SUBJECT,
        replyTo: parsed.data.email,
        text: [
          `Name: ${parsed.data.name}`,
          `Email: ${parsed.data.email}`,
          `Subject: ${parsed.data.subject ?? "(none)"}`,
          "",
          parsed.data.message,
        ].join("\n"),
      });
      if (error) console.error("Resend send failed:", error);
    } catch (error) {
      console.error("Resend send threw:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
