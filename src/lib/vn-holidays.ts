import { lunarMonthLength, solarToLunar } from "./lunar";
import { parseYmd } from "./ymd";

export type Holiday = { name: string; kind: "lunar" | "solar" };

// "month-day" keys. Lunar ones apply to non-leap months only.
const LUNAR_HOLIDAYS: Record<string, string> = {
  "1-1": "Tết Nguyên Đán",
  "1-2": "Tết Nguyên Đán",
  "1-3": "Tết Nguyên Đán",
  "1-15": "Rằm tháng Giêng",
  "3-10": "Giỗ Tổ Hùng Vương",
  "4-15": "Phật Đản",
  "5-5": "Tết Đoan Ngọ",
  "7-15": "Vu Lan",
  "8-15": "Tết Trung Thu",
  "12-23": "Ông Công Ông Táo",
};

const SOLAR_HOLIDAYS: Record<string, string> = {
  "1-1": "Tết Dương lịch",
  "2-14": "Valentine",
  "3-8": "Quốc tế Phụ nữ",
  "4-30": "Giải phóng miền Nam",
  "5-1": "Quốc tế Lao động",
  "9-2": "Quốc khánh",
  "10-20": "Phụ nữ Việt Nam",
  "11-20": "Nhà giáo Việt Nam",
  "12-24": "Giáng Sinh",
  "12-25": "Giáng Sinh",
};

export function getHolidays(date: string): Holiday[] {
  const result: Holiday[] = [];
  const lunar = solarToLunar(date);
  if (!lunar.leap) {
    const lunarName = LUNAR_HOLIDAYS[`${lunar.month}-${lunar.day}`];
    if (lunarName) result.push({ name: lunarName, kind: "lunar" });
    if (lunar.month === 12 && lunar.day === lunarMonthLength(12, lunar.year, false)) {
      result.push({ name: "Giao Thừa", kind: "lunar" });
    }
  }
  const { m, d } = parseYmd(date);
  const solarName = SOLAR_HOLIDAYS[`${m}-${d}`];
  if (solarName) result.push({ name: solarName, kind: "solar" });
  return result;
}
