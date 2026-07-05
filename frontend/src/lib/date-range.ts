export type DatePreset = "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

function dayBounds(base: Date): DateRange {
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999);
  return { start, end };
}

export function getPresetRange(
  preset: DatePreset,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date();

  switch (preset) {
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return dayBounds(y);
    }
    case "thisWeek": {
      const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: dayBounds(monday).start,
        end: dayBounds(sunday).end,
      };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "custom": {
      if (customStart && customEnd) {
        return {
          start: dayBounds(new Date(customStart)).start,
          end: dayBounds(new Date(customEnd)).end,
        };
      }
      return dayBounds(now);
    }
    case "today":
    default:
      return dayBounds(now);
  }
}
