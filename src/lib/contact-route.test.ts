import { beforeEach, describe, expect, it, vi } from "vitest";

const createContactMessage = vi.fn();
const send = vi.fn();

vi.mock("@/lib/content/contact-messages", () => ({
  createContactMessage: (...args: unknown[]) => createContactMessage(...args),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => send(...args) };
  },
}));

import { POST } from "@/app/api/contact/route";

let ip = 0;
function request(body: string): Request {
  // A fresh IP per request keeps the in-memory rate limiter out of the way.
  ip += 1;
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ip}` },
    body,
  });
}

const valid = { name: "Ana", email: "ana@example.com", subject: "Hello there", message: "A message that is long enough." };

beforeEach(() => {
  createContactMessage.mockReset().mockResolvedValue(undefined);
  send.mockReset().mockResolvedValue({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/contact", () => {
  it("rejects malformed JSON and a null body with 400", async () => {
    expect((await POST(request("{not json"))).status).toBe(400);
    expect((await POST(request("null"))).status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("rejects a message over the shared length limit with 400", async () => {
    const res = await POST(request(JSON.stringify({ ...valid, message: "x".repeat(2001) })));
    expect(res.status).toBe(400);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("silently accepts a filled honeypot without saving", async () => {
    const res = await POST(request(JSON.stringify({ ...valid, website: "spam.example" })));
    expect(res.status).toBe(200);
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it("saves the message even when the notification email fails", async () => {
    send.mockRejectedValue(new Error("resend down"));
    const res = await POST(request(JSON.stringify(valid)));
    expect(res.status).toBe(200);
    expect(createContactMessage).toHaveBeenCalledTimes(1);
  });
});
