import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type { ContactMessageOutput } from "@/lib/contact-schema";

export async function createContactMessage(
  input: ContactMessageOutput
): Promise<void> {
  await db.cmsContactMessage.create({
    data: {
      id: generateId("contact"),
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    },
  });
}
