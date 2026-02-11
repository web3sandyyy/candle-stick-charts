import type { ChartManagerOptions, ChartLayout, ChartColors } from "./types";

// Default options
export const DEFAULT_OPTIONS: Required<ChartManagerOptions> = {
  theme: "dark",
  height: 600,
  showVolume: false,
  watermark: "",
  showGrid: true,
  timezone: "Asia/Kolkata",
  autoSize: true,
  isIntraday: false,
};

// Layout configuration
export const LAYOUT: ChartLayout = {
  padding: 0.02,
  paneHeight: 0.15,
  minPriceHeight: 0.4,
};

// Helper to get theme colors
export const getColors = (theme: "dark" | "light"): ChartColors => {
  const isDark = theme === "dark";
  return {
    bg: isDark ? "#1a1a1a" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    grid: isDark ? "#262626" : "#f2f2f2",
    border: isDark ? "#262626" : "#f2f2f2",
  };
};

// Time formatter for IST
export const formatTimeIST = (time: number, isIntraday?: boolean): string => {
  const date = new Date(time * 1000);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(isIntraday && {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
  return new Intl.DateTimeFormat("en-IN", options).format(date);
};

// Tick mark formatter
// This formatter shows date+time at the first candle of each day, time for others (best possible with formatter only)

let lastIntradayDay: number | null = null;
let lastIntradayMonth: number | null = null;
let lastIntradayYear: number | null = null;

export const tickMarkFormatter = (
  time: number,
  tickMarkType?: number,
  isIntraday?: boolean
): string => {
  const date = new Date(time * 1000);
  const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();

  // For 1d and higher intervals, use tickMarkType to show year/month/date only 0-year, 1-month, 2-day, and 3-time
  if (!isIntraday) {
    if (tickMarkType === 0) {
      return istDate.toLocaleString("en-IN", { year: "numeric" });
    }
    if (tickMarkType === 1) {
      return istDate.toLocaleString("en-IN", { month: "short", year: "numeric" });
    }
    return istDate.toLocaleString("en-IN", { day: "2-digit", month: "short" });
  }

  // For intraday, show date+time at first candle of each day, time for others
  let showDate = false;
  if (lastIntradayDay === null || lastIntradayMonth === null || lastIntradayYear === null) {
    showDate = true;
  } else if (day !== lastIntradayDay || month !== lastIntradayMonth || year !== lastIntradayYear) {
    showDate = true;
  }
  lastIntradayDay = day;
  lastIntradayMonth = month;
  lastIntradayYear = year;

  if (showDate) {
    return istDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return istDate.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
