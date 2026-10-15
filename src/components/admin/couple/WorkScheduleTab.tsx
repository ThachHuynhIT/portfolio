"use client";

import { useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/admin/FormField";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { workOverrideSchema } from "@/lib/couple-schedule-schema";
import { getWorkStatus, type WorkSchedule } from "@/lib/work-schedule";
import { addDays, isoWeekday, parseYmd, todayYmd } from "@/lib/ymd";
import type { CoupleData, CoupleWorkOverride } from "@/lib/types";

const inputClass =
  "w-full px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500/50";
const WEEKDAYS = [
  { value: 1, label: "T2" }, { value: 2, label: "T3" }, { value: 3, label: "T4" }, { value: 4, label: "T5" },
  { value: 5, label: "T6" }, { value: 6, label: "T7" }, { value: 7, label: "CN" },
];

// The form edits one flat record per person; it's converted to the API's
// discriminated union on submit so switching type never loses typed values.
const personFormSchema = z
  .object({
    enabled: z.boolean(),
    type: z.enum(["rotation", "office"]),
    startDate: z.string(),
    workDays: z.number({ error: "Nhập số từ 1 đến 30" }).int().min(1, "Ít nhất 1").max(30),
    offDays: z.number({ error: "Nhập số từ 1 đến 30" }).int().min(1, "Ít nhất 1").max(30),
    weekdays: z.array(z.number().int().min(1).max(7)),
  })
  .superRefine((v, ctx) => {
    if (v.type === "rotation" && !/^\d{4}-\d{2}-\d{2}$/.test(v.startDate)) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Chọn ngày bắt đầu" });
    }
    if (v.type === "office" && v.weekdays.length === 0) {
      ctx.addIssue({ code: "custom", path: ["weekdays"], message: "Chọn ít nhất 1 thứ" });
    }
  });
const formSchema = z.object({ p1: personFormSchema, p2: personFormSchema });
type FormValues = z.infer<typeof formSchema>;
type PersonForm = FormValues["p1"];

function toPersonForm(data: CoupleData, person: 1 | 2): PersonForm {
  const s = data.workSchedules.find((x) => x.person === person);
  return {
    enabled: s?.enabled ?? false,
    type: s?.type ?? "office",
    startDate: s?.type === "rotation" ? s.startDate : todayYmd(),
    workDays: s?.type === "rotation" ? s.workDays : 1,
    offDays: s?.type === "rotation" ? s.offDays : 2,
    weekdays: s?.type === "office" ? s.weekdays : [1, 2, 3, 4, 5],
  };
}

function toSchedule(v: PersonForm): WorkSchedule {
  return v.type === "rotation"
    ? { type: "rotation", enabled: v.enabled, startDate: v.startDate, workDays: v.workDays, offDays: v.offDays }
    : { type: "office", enabled: v.enabled, weekdays: [...v.weekdays].sort((a, b) => a - b) };
}

function Preview({ control, name, overrides }: { control: Control<FormValues>; name: "p1" | "p2"; overrides: CoupleWorkOverride[] }) {
  const value = useWatch({ control, name });
  const parsed = personFormSchema.safeParse(value);
  if (!parsed.success) return null;
  const schedule = toSchedule(parsed.data);
  const today = todayYmd();
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
      {Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, i);
        const st = getWorkStatus(schedule, overrides, date);
        const { d } = parseYmd(date);
        return (
          <div
            key={date}
            title={date}
            className={`shrink-0 w-9 rounded-lg py-1 text-center text-[10px] border ${
              st.status === "work" ? "bg-pink-500/25 border-pink-400/40 text-pink-100" : st.status === "off" ? "border-white/15 text-slate-300" : "border-white/5 text-slate-600"
            }`}
          >
            <div>{WEEKDAYS[isoWeekday(date) - 1].label}</div>
            <div className="font-bold">{d}</div>
            <div>{st.status === "work" ? "Làm" : st.status === "off" ? "Nghỉ" : "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function WorkScheduleTab({ data, onChanged }: { data: CoupleData; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { p1: toPersonForm(data, 1), p2: toPersonForm(data, 2) },
  });

  const onSubmit = async (values: FormValues) => {
    const schedules = ([1, 2] as const).map((person) => ({ person, ...toSchedule(values[person === 1 ? "p1" : "p2"]) }));
    const res = await fetch("/api/admin/couple/work-schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedules }),
    });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error || "Lưu lịch làm thất bại");
      return;
    }
    toast.success("Đã lưu lịch làm");
    await onChanged();
  };

  const names = { p1: data.person1, p2: data.person2 } as const;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(["p1", "p2"] as const).map((key) => {
            const type = watch(`${key}.type`);
            const weekdays = watch(`${key}.weekdays`);
            const errors = formState.errors[key];
            const person = key === "p1" ? 1 : 2;
            return (
              <div key={key} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{names[key]}</h3>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" {...register(`${key}.enabled`)} /> Bật lịch
                  </label>
                </div>
                <FormField label="Kiểu lịch" id={`${key}-type`}>
                  <select id={`${key}-type`} {...register(`${key}.type`)} className={inputClass}>
                    <option value="office">Hành chính (theo thứ trong tuần)</option>
                    <option value="rotation">Xoay vòng (làm N nghỉ M)</option>
                  </select>
                </FormField>
                {type === "rotation" ? (
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Ngày làm đầu tiên" id={`${key}-start`} error={errors?.startDate?.message}>
                      <input id={`${key}-start`} type="date" {...register(`${key}.startDate`)} className={inputClass} />
                    </FormField>
                    <FormField label="Số ngày làm" id={`${key}-work`} error={errors?.workDays?.message}>
                      <input id={`${key}-work`} type="number" min={1} max={30} {...register(`${key}.workDays`, { valueAsNumber: true })} className={inputClass} />
                    </FormField>
                    <FormField label="Số ngày nghỉ" id={`${key}-off`} error={errors?.offDays?.message}>
                      <input id={`${key}-off`} type="number" min={1} max={30} {...register(`${key}.offDays`, { valueAsNumber: true })} className={inputClass} />
                    </FormField>
                  </div>
                ) : (
                  <FormField label="Các thứ đi làm" id={`${key}-weekdays`} error={errors?.weekdays?.message}>
                    <div id={`${key}-weekdays`} className="flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((w) => {
                        const on = weekdays.includes(w.value);
                        return (
                          <button
                            key={w.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              setValue(`${key}.weekdays`, on ? weekdays.filter((x) => x !== w.value) : [...weekdays, w.value], { shouldValidate: true })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs border ${on ? "bg-pink-500/30 border-pink-400/50 text-white" : "border-white/10 text-slate-400"}`}
                          >
                            {w.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}
                <div>
                  <div className="text-xs text-slate-500 mb-1">14 ngày tới</div>
                  <Preview control={control} name={key} overrides={data.workOverrides.filter((o) => o.person === person)} />
                </div>
              </div>
            );
          })}
        </div>
        <button type="submit" disabled={formState.isSubmitting} className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-sm font-semibold disabled:opacity-50">
          {formState.isSubmitting ? "Đang lưu…" : "Lưu lịch làm"}
        </button>
      </form>

      <OverridesPanel data={data} onChanged={onChanged} />
    </div>
  );
}

// The schema trims/drops the note (a transform), so input and output types differ.
type OverrideInput = z.input<typeof workOverrideSchema>;
type OverrideOutput = z.output<typeof workOverrideSchema>;

function OverridesPanel({ data, onChanged }: { data: CoupleData; onChanged: () => Promise<void> }) {
  const { toast } = useToast();
  const [showPast, setShowPast] = useState(false);
  const today = todayYmd();
  const { register, handleSubmit, reset, formState } = useForm<OverrideInput, unknown, OverrideOutput>({
    resolver: zodResolver(workOverrideSchema),
    defaultValues: { person: 1, date: today, status: "off", note: "" },
  });

  const list = data.workOverrides.filter((o) => showPast || o.date >= today);

  const onAdd = async (values: OverrideOutput) => {
    const res = await fetch("/api/admin/couple/work-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).error || "Không lưu được ngày sửa riêng");
      return;
    }
    toast.success("Đã lưu ngày sửa riêng");
    reset({ ...values, note: "" });
    await onChanged();
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/admin/couple/work-overrides/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Không xoá được");
      return;
    }
    await onChanged();
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Ngày sửa riêng</h3>
        <label className="inline-flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Hiện ngày đã qua
        </label>
      </div>
      <form onSubmit={handleSubmit(onAdd)} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
        <FormField label="Người" id="ov-person">
          <select id="ov-person" {...register("person", { setValueAs: (v) => Number(v) })} className={inputClass}>
            <option value={1}>{data.person1}</option>
            <option value={2}>{data.person2}</option>
          </select>
        </FormField>
        <FormField label="Ngày" id="ov-date" error={formState.errors.date?.message}>
          <input id="ov-date" type="date" {...register("date")} className={inputClass} />
        </FormField>
        <FormField label="Trạng thái" id="ov-status">
          <select id="ov-status" {...register("status")} className={inputClass}>
            <option value="off">Nghỉ</option>
            <option value="work">Đi làm</option>
          </select>
        </FormField>
        <FormField label="Ghi chú" id="ov-note" error={formState.errors.note?.message}>
          <input id="ov-note" placeholder="nghỉ phép, đổi ca…" {...register("note")} className={inputClass} />
        </FormField>
        <button type="submit" disabled={formState.isSubmitting} className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white">
          Thêm
        </button>
      </form>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có ngày sửa riêng.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {list.map((o) => (
            <li key={o.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-200">
                {parseYmd(o.date).d}/{parseYmd(o.date).m}/{parseYmd(o.date).y} · {o.person === 1 ? data.person1 : data.person2} ·{" "}
                {o.status === "work" ? "đi làm" : "nghỉ"}
                {o.note ? ` (${o.note})` : ""}
              </span>
              <button type="button" onClick={() => onDelete(o.id)} aria-label="Xoá" className="text-slate-500 hover:text-red-400">
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
