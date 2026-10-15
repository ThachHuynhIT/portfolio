"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import { buildMonthGrid } from "@/lib/calendar-grid";
import { occurrencesInYear } from "@/lib/couple-events";
import { canChiDay, canChiYear, solarToLunar } from "@/lib/lunar";
import { getHolidays } from "@/lib/vn-holidays";
import { getWorkStatus, isBothOff, nextBothOff, type WorkStatus } from "@/lib/work-schedule";
import { daysBetween, isoWeekday, parseYmd, todayYmd } from "@/lib/ymd";
import type { CoupleData } from "@/lib/types";
import styles from "./CoupleCalendar.module.css";

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_LONG = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

function statusText(s: WorkStatus): string {
  if (s.status === "none") return "chưa có lịch";
  const base = s.status === "work" ? "đi làm" : "nghỉ";
  return s.note ? `${base} (${s.note})` : base;
}

export default function CoupleCalendar({ data }: { data: CoupleData }) {
  const today = todayYmd();
  const [view, setView] = useState(() => {
    const { y, m } = parseYmd(today);
    return { y, m };
  });
  const [selected, setSelected] = useState(today);

  const s1 = data.workSchedules.find((s) => s.person === 1) ?? null;
  const s2 = data.workSchedules.find((s) => s.person === 2) ?? null;
  const o1 = useMemo(() => data.workOverrides.filter((o) => o.person === 1), [data.workOverrides]);
  const o2 = useMemo(() => data.workOverrides.filter((o) => o.person === 2), [data.workOverrides]);

  const grid = useMemo(() => buildMonthGrid(view.y, view.m), [view]);

  // Birthdays/special dates keyed by the solar date they fall on in the visible years.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { emoji: string; name: string }[]>();
    const years = new Set(grid.map((c) => parseYmd(c.date).y));
    const all = [
      ...data.birthdays.map((b) => ({ ...b, name: `Sinh nhật ${b.name}` })),
      ...data.specialDates,
    ];
    for (const year of years) {
      for (const ev of all) {
        for (const date of occurrencesInYear(ev, year)) {
          map.set(date, [...(map.get(date) ?? []), { emoji: ev.emoji, name: ev.name }]);
        }
      }
    }
    return map;
  }, [grid, data.birthdays, data.specialDates]);

  const nextOff = useMemo(() => nextBothOff(s1, o1, s2, o2, today), [s1, o1, s2, o2, today]);

  const firstLunar = solarToLunar(grid.find((c) => c.inMonth)!.date);
  const lastLunar = solarToLunar([...grid].reverse().find((c) => c.inMonth)!.date);
  const lunarMonths =
    firstLunar.month === lastLunar.month ? `Tháng ${firstLunar.month} âm` : `Tháng ${firstLunar.month} – ${lastLunar.month} âm`;

  const shiftMonth = (delta: number) =>
    setView(({ y, m }) => {
      const index = y * 12 + (m - 1) + delta;
      return { y: Math.floor(index / 12), m: (index % 12) + 1 };
    });

  const goToday = () => {
    const { y, m } = parseYmd(today);
    setView({ y, m });
    setSelected(today);
  };

  const sel = parseYmd(selected);
  const selLunar = solarToLunar(selected);
  const selStatus1 = getWorkStatus(s1, o1, selected);
  const selStatus2 = getWorkStatus(s2, o2, selected);
  const selHolidays = getHolidays(selected);
  const selEvents = eventsByDate.get(selected) ?? [];

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <div>
          <div className={styles.monthTitle}>Tháng {view.m}, {view.y}</div>
          <div className={styles.lunarTitle}>
            {lunarMonths} · năm {canChiYear(lastLunar.year)}
          </div>
        </div>
        <div className={styles.navGroup}>
          <button type="button" className={styles.navButton} onClick={() => shiftMonth(-1)} aria-label="Tháng trước">
            <Icon name="chevronLeft" size={16} />
          </button>
          <button type="button" className={styles.navButton} onClick={goToday}>Hôm nay</button>
          <button type="button" className={styles.navButton} onClick={() => shiftMonth(1)} aria-label="Tháng sau">
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>

      {nextOff && (
        <div className={styles.summary}>
          💕 Ngày cả hai cùng nghỉ tiếp theo: <strong>{WEEKDAY_LONG[isoWeekday(nextOff) - 1]}, {parseYmd(nextOff).d}/{parseYmd(nextOff).m}</strong>
          {" "}({daysBetween(today, nextOff) === 0 ? "hôm nay" : `còn ${daysBetween(today, nextOff)} ngày`})
        </div>
      )}

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} className={styles.weekday}>{w}</div>
        ))}
      </div>

      <div className={styles.grid}>
        {grid.map(({ date, inMonth }) => {
          const { d } = parseYmd(date);
          const lunar = solarToLunar(date);
          const st1 = getWorkStatus(s1, o1, date);
          const st2 = getWorkStatus(s2, o2, date);
          const bothOff = isBothOff(st1, st2);
          const holidays = getHolidays(date);
          const events = eventsByDate.get(date) ?? [];
          const accent = !lunar.leap && (lunar.day === 1 || lunar.day === 15);
          const lunarText = lunar.day === 1 ? `${lunar.day}/${lunar.month}${lunar.leap ? "N" : ""}` : `${lunar.day}`;
          const label = [
            `${WEEKDAY_LONG[isoWeekday(date) - 1]} ${d} tháng ${parseYmd(date).m}`,
            `ngày ${lunar.day} tháng ${lunar.month}${lunar.leap ? " nhuận" : ""} âm`,
            bothOff ? "cả hai cùng nghỉ" : "",
            ...holidays.map((h) => h.name),
            ...events.map((e) => e.name),
          ].filter(Boolean).join(", ");
          const className = [
            styles.cell,
            inMonth ? "" : styles.outside,
            date === today ? styles.today : "",
            bothOff ? styles.bothOff : "",
            date === selected ? styles.selected : "",
          ].filter(Boolean).join(" ");

          return (
            <button key={date} type="button" aria-label={label} aria-pressed={date === selected} className={className} onClick={() => setSelected(date)}>
              <span className={styles.solarDay}>{d}</span>
              <span className={`${styles.lunarDay} ${accent ? styles.lunarAccent : ""}`}>{lunarText}</span>
              <span className={styles.markers} aria-hidden="true">
                {holidays.length > 0 && <span className={styles.holidayDot} />}
                {events.slice(0, 2).map((e) => <span key={e.name}>{e.emoji}</span>)}
              </span>
              {bothOff && <span className={styles.heart} aria-hidden="true">💗</span>}
              {(st1.overridden || st2.overridden) && <span className={styles.overrideDot} aria-hidden="true" />}
              <span className={styles.bars} aria-hidden="true">
                <span className={`${styles.bar} ${st1.status === "none" ? styles.barNone : st1.status === "work" ? styles.barWork1 : styles.barOff1}`} />
                <span className={`${styles.bar} ${st2.status === "none" ? styles.barNone : st2.status === "work" ? styles.barWork2 : styles.barOff2}`} />
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.barWork1}`} /> {data.person1} đi làm</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.barWork2}`} /> {data.person2} đi làm</span>
        <span className={styles.legendItem}><span className={`${styles.legendSwatch} ${styles.barOff1}`} /> viền = nghỉ</span>
        <span className={styles.legendItem}>💗 cả hai cùng nghỉ</span>
        <span className={styles.legendItem}><span className={styles.holidayDot} /> ngày lễ</span>
      </div>

      <div className={styles.detail} aria-live="polite">
        <div className={styles.detailTitle}>
          {WEEKDAY_LONG[isoWeekday(selected) - 1]}, {sel.d}/{sel.m}/{sel.y}
        </div>
        <div className={styles.detailMuted}>
          Âm lịch: {selLunar.day}/{selLunar.month}{selLunar.leap ? " (nhuận)" : ""} · ngày {canChiDay(selected)} · năm {canChiYear(selLunar.year)}
        </div>
        {selHolidays.map((h) => <div key={h.name} className={styles.detailRow}>🎌 {h.name}</div>)}
        {selEvents.map((e) => <div key={e.name} className={styles.detailRow}>{e.emoji} {e.name}</div>)}
        <div className={styles.detailRow}>{data.person1}: {statusText(selStatus1)}</div>
        <div className={styles.detailRow}>{data.person2}: {statusText(selStatus2)}</div>
        {isBothOff(selStatus1, selStatus2) && <div className={styles.detailRow}>💕 Cả hai cùng nghỉ — hẹn nhau thôi!</div>}
      </div>
    </div>
  );
}
