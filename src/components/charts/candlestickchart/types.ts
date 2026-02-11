import type { IChartApi, ISeriesApi } from "lightweight-charts";

export type ChartStyle = "candlestick" | "line" | "area" | "heikin-ashi" | "bar";

export interface ChartAppearance {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  showGrid: boolean;
  showWatermark: boolean;
  showVolume: boolean;
  borderUpColor?: string;
  borderDownColor?: string;
}

export interface OHLCVData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ChartMarker {
  time: number;
  position: "belowBar" | "aboveBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text: string;
  size?: number;
}

export interface ChartManagerOptions {
  theme?: "dark" | "light";
  height?: number;
  showVolume?: boolean;
  watermark?: string;
  showGrid?: boolean;
  timezone?: string;
  autoSize?: boolean;
  isIntraday?: boolean;
}

export interface IndicatorConfig {
  period?: number;
  color?: string;
  mult?: number;
  atr?: number;
  ema?: number;
  f?: number;
  s?: number;
  g?: number;
  k?: number;
  d?: number;
  t?: number;
  r?: number;
  start?: number;
  inc?: number;
  max?: number;
  pct?: number;
  [key: string]: any;
}

export interface IndicatorDefinition {
  pane: "overlay" | "sep";
  render: "line" | "hist" | "composite" | "segments";
  defaults: IndicatorConfig;
  calc: (data: OHLCVData[], cfg: IndicatorConfig) => any;
  lines?: { k: string; color?: string; type?: string; width?: number; style?: number }[];
}

export interface IndicatorInstance {
  type: string;
  def: IndicatorDefinition;
  cfg: IndicatorConfig;
  series: ISeriesApi<any> | Record<string, ISeriesApi<any>> | ISeriesApi<any>[];
  isOverlay: boolean;
  scaleId: string;
}

export interface ChartColors {
  bg: string;
  text: string;
  grid: string;
  border: string;
}

export interface ChartLayout {
  padding: number;
  paneHeight: number;
  minPriceHeight: number;
}

export interface ChartRef {
  setData: (data: OHLCVData[]) => void;
  setMarkers: (markers: ChartMarker[]) => void;
  addIndicator?: (type: string, opts?: IndicatorConfig) => string | null;
  removeIndicator?: (id: string) => void;
  clearIndicators?: () => void;
  getIndicators: () => string[];
  setTheme: () => void;
  fitContent: () => void;
  takeScreenshot: () => string | null;
  resize: () => void;
  getChart: () => IChartApi | null;
  clearMarkers: () => void;
  setChartType: (type: "candlestick" | "bar" | "line" | "area") => void;
}

export interface CandleStickChartProps {
  options?: ChartManagerOptions;
  data?: OHLCVData[];
  markers?: ChartMarker[];

  chartStyle?: ChartStyle;
  appearance?: ChartAppearance;

  className?: string;
  style?: React.CSSProperties;

  onCrosshairMove?: (data: OHLCVData | null) => void;
  showBuySellButtons?: boolean;
}

// Default chart appearance
export const DEFAULT_CHART_APPEARANCE: ChartAppearance = {
  upColor: "#22c55e",
  downColor: "#ef4444",
  wickUpColor: "#22c55e",
  wickDownColor: "#ef4444",
  showGrid: true,
  showWatermark: false,
  showVolume: true,
};
