import { z } from "zod";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có dạng YYYY-MM-DD");
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
