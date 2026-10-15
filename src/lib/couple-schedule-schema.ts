import { z } from "zod";

const ymdPattern = /^\d{4}-\d{2}-\d{2}$/;
const ymd = z.string().regex(ymdPattern, "Ngày phải có dạng YYYY-MM-DD");
const person = z.union([z.literal(1), z.literal(2)]);

export const workScheduleSchema = z.discriminatedUnion("type", [
  z.object({
    person,
    type: z.literal("rotation"),
    enabled: z.boolean(),
    startDate: ymd,
    workDays: z.number().int().min(1, "Ít nhất 1 ngày").max(30),
    offDays: z.number().int().min(1, "Ít nhất 1 ngày").max(30),
  }),
  z.object({
    person,
    type: z.literal("office"),
    enabled: z.boolean(),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1, "Chọn ít nhất 1 thứ"),
  }),
]);

export const workSchedulesBodySchema = z.object({ schedules: z.array(workScheduleSchema).max(2) });

export const workOverrideSchema = z.object({
  person,
  date: ymd,
  status: z.enum(["work", "off"]),
  note: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

// Flat per-person record edited by the admin form. Fields that belong to the
// other schedule type are ignored, so a hidden field can never block submit.
const cycleDays = z.union([z.number(), z.nan()]);
export const personFormSchema = z
  .object({
    enabled: z.boolean(),
    type: z.enum(["rotation", "office"]),
    startDate: z.string(),
    workDays: cycleDays,
    offDays: cycleDays,
    weekdays: z.array(z.number().int().min(1).max(7)),
  })
  .superRefine((v, ctx) => {
    if (v.type === "rotation") {
      if (!ymdPattern.test(v.startDate)) {
        ctx.addIssue({ code: "custom", path: ["startDate"], message: "Chọn ngày bắt đầu" });
      }
      for (const key of ["workDays", "offDays"] as const) {
        const n = v[key];
        if (!Number.isInteger(n) || n < 1 || n > 30) {
          ctx.addIssue({ code: "custom", path: [key], message: "Nhập số nguyên từ 1 đến 30" });
        }
      }
    } else if (v.weekdays.length === 0) {
      ctx.addIssue({ code: "custom", path: ["weekdays"], message: "Chọn ít nhất 1 thứ" });
    }
  });
