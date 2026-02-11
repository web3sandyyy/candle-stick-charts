import {
  TrendingUp,
  Activity,
  BarChart3,
  Waves,
  LineChart,
  AreaChart,
  PieChart,
  Layers,
  type LucideIcon,
} from "lucide-react";

// Category configuration with icons, labels, and descriptions
export const INDICATOR_CATEGORY_CONFIG: Record<
  string,
  { icon: LucideIcon; label: string; description: string }
> = {
  TREND: {
    icon: TrendingUp,
    label: "Trend",
    description: "Identify market direction",
  },
  BANDS: {
    icon: Layers,
    label: "Bands & Channels",
    description: "Volatility envelopes",
  },
  MOMENTUM: {
    icon: Activity,
    label: "Momentum",
    description: "Speed of price changes",
  },
  OSCILLATORS: {
    icon: Waves,
    label: "Oscillators",
    description: "Overbought/oversold signals",
  },
  HYBRID: {
    icon: LineChart,
    label: "Hybrid",
    description: "Multi-purpose indicators",
  },
  VOLATILITY: {
    icon: BarChart3,
    label: "Volatility",
    description: "Measure price fluctuations",
  },
  VOLUME: {
    icon: AreaChart,
    label: "Volume",
    description: "Trading activity analysis",
  },
  STATISTICS: {
    icon: PieChart,
    label: "Statistics",
    description: "Statistical measures",
  },
};

// Indicators grouped by category
export const INDICATOR_CATEGORIES: Record<string, string[]> = {
  TREND: [
    "SMA",
    "EMA",
    "WMA",
    "VWAP",
  ],
  BANDS: [
    "Bollinger",
  ],
  MOMENTUM: [
    "RSI",
    "MACD",
  ],
};

// List of all available indicators
export const PlotlyIndicators = [
  { id: 1, indicator: "SMA" },
  { id: 2, indicator: "EMA" },
  { id: 3, indicator: "WMA" },
  { id: 4, indicator: "VWAP" },
  { id: 5, indicator: "Bollinger" },
  { id: 6, indicator: "RSI" },
  { id: 7, indicator: "MACD" },
];

// Popular/Featured indicators for quick access
export const FEATURED_INDICATORS = [
  "SMA",
  "EMA",
  "RSI",
  "MACD",
  "Bollinger",
  "VWAP",
];

// Helper function to get category for an indicator
export const getCategoryForIndicator = (indicator: string): string => {
  for (const [category, indicators] of Object.entries(INDICATOR_CATEGORIES)) {
    if (indicators.includes(indicator)) {
      return category;
    }
  }
  return "OTHER";
};

// Get all category keys
export const INDICATOR_CATEGORY_KEYS = Object.keys(INDICATOR_CATEGORY_CONFIG);
