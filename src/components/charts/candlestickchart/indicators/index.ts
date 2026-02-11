import type { LineData, HistogramData, Time } from "lightweight-charts";
import type { OHLCVData, IndicatorDefinition } from "../types";

// ==========================================
// CALCULATION FUNCTIONS
// ==========================================

// Simple Moving Average
export const calcSMA = (d: OHLCVData[], p: number): LineData<Time>[] => {
  const r: LineData<Time>[] = [];
  for (let i = p - 1; i < d.length; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += d[i - j].close;
    r.push({ time: d[i].time as Time, value: s / p });
  }
  return r;
};

// Exponential Moving Average
export const calcEMA = (d: OHLCVData[], p: number): LineData<Time>[] => {
  const r: LineData<Time>[] = [];
  const k = 2 / (p + 1);
  let e = d[0].close;
  for (let i = 0; i < d.length; i++) {
    e = d[i].close * k + e * (1 - k);
    if (i >= p - 1) r.push({ time: d[i].time as Time, value: e });
  }
  return r;
};

// EMA from Line data (internal helper)
const calcEMAFromLine = (d: LineData<Time>[], p: number): LineData<Time>[] => {
  const r: LineData<Time>[] = [];
  const k = 2 / (p + 1);
  let e = d[0].value;
  for (let i = 0; i < d.length; i++) {
    e = d[i].value * k + e * (1 - k);
    if (i >= p - 1) r.push({ time: d[i].time as Time, value: e });
  }
  return r;
};

// Weighted Moving Average
export const calcWMA = (d: OHLCVData[], p: number): LineData<Time>[] => {
  const r: LineData<Time>[] = [];
  for (let i = p - 1; i < d.length; i++) {
    let s = 0,
      w = 0;
    for (let j = 0; j < p; j++) {
      s += d[i - j].close * (p - j);
      w += p - j;
    }
    r.push({ time: d[i].time as Time, value: s / w });
  }
  return r;
};

// Bollinger Bands
export const calcBB = (
  d: OHLCVData[],
  p: number,
  m: number
): { upper: LineData<Time>[]; middle: LineData<Time>[]; lower: LineData<Time>[] } => {
  const u: LineData<Time>[] = [],
    mid: LineData<Time>[] = [],
    l: LineData<Time>[] = [];
  for (let i = p - 1; i < d.length; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += d[i - j].close;
    const sma = s / p;
    let sq = 0;
    for (let j = 0; j < p; j++) sq += Math.pow(d[i - j].close - sma, 2);
    const std = Math.sqrt(sq / p);
    u.push({ time: d[i].time as Time, value: sma + std * m });
    mid.push({ time: d[i].time as Time, value: sma });
    l.push({ time: d[i].time as Time, value: sma - std * m });
  }
  return { upper: u, middle: mid, lower: l };
};

// Relative Strength Index
export const calcRSI = (d: OHLCVData[], p: number): LineData<Time>[] => {
  const r: LineData<Time>[] = [];
  let ag = 0,
    al = 0;
  for (let i = 1; i < d.length; i++) {
    const c = d[i].close - d[i - 1].close;
    const g = c > 0 ? c : 0;
    const l = c < 0 ? -c : 0;
    if (i < p) {
      ag += g;
      al += l;
    } else {
      if (i === p) {
        ag /= p;
        al /= p;
      } else {
        ag = (ag * (p - 1) + g) / p;
        al = (al * (p - 1) + l) / p;
      }
      r.push({ time: d[i].time as Time, value: 100 - 100 / (1 + (al ? ag / al : 100)) });
    }
  }
  return r;
};

// MACD
export const calcMACD = (
  d: OHLCVData[],
  f: number,
  s: number,
  g: number
): { macd: LineData<Time>[]; signal: LineData<Time>[]; hist: HistogramData<Time>[] } => {
  const ef = calcEMA(d, f);
  const es = calcEMA(d, s);
  const m = new Map(ef.map(x => [x.time, x.value]));
  const mac: LineData<Time>[] = [];
  es.forEach(x => {
    if (m.has(x.time)) mac.push({ time: x.time as Time, value: m.get(x.time)! - x.value });
  });
  const sig = calcEMAFromLine(mac, g);
  const sm = new Map(sig.map(x => [x.time, x.value]));
  const hist: HistogramData<Time>[] = [];
  mac.forEach(x => {
    if (sm.has(x.time)) {
      const v = x.value - sm.get(x.time)!;
      hist.push({ time: x.time as Time, value: v, color: v >= 0 ? "#26a69a" : "#ef5350" });
    }
  });
  return { macd: mac, signal: sig, hist };
};

// Volume Weighted Average Price
export const calcVWAP = (d: OHLCVData[]): LineData<Time>[] => {
  const r: LineData<Time>[] = [];
  let tpv = 0,
    v = 0;
  for (let i = 0; i < d.length; i++) {
    const tp = (d[i].high + d[i].low + d[i].close) / 3;
    tpv += tp * (d[i].volume || 0);
    v += d[i].volume || 0;
    r.push({ time: d[i].time as Time, value: v ? tpv / v : tp });
  }
  return r;
};

// ==========================================
// INDICATOR DEFINITIONS
// ==========================================

const indicatorDefinitions: Record<string, IndicatorDefinition> = {
  // Moving Averages (Overlay)
  sma: {
    pane: "overlay",
    render: "line",
    defaults: { period: 20 },
    calc: (d, c) => calcSMA(d, c.period!),
  },
  ema: {
    pane: "overlay",
    render: "line",
    defaults: { period: 20 },
    calc: (d, c) => calcEMA(d, c.period!),
  },
  wma: {
    pane: "overlay",
    render: "line",
    defaults: { period: 20 },
    calc: (d, c) => calcWMA(d, c.period!),
  },
  vwap: {
    pane: "overlay",
    render: "line",
    defaults: {},
    calc: d => calcVWAP(d),
  },
  // Bollinger Bands (Overlay)
  bb: {
    pane: "overlay",
    render: "composite",
    defaults: { period: 20, mult: 2 },
    lines: [
      { k: "upper", color: "#2196f3" },
      { k: "middle", color: "#ff9800" },
      { k: "lower", color: "#2196f3" },
    ],
    calc: (d, c) => calcBB(d, c.period!, c.mult!),
  },
  // Oscillators (Separate pane)
  rsi: {
    pane: "sep",
    render: "line",
    defaults: { period: 14 },
    calc: (d, c) => calcRSI(d, c.period!),
  },
  macd: {
    pane: "sep",
    render: "composite",
    defaults: { f: 12, s: 26, g: 9 },
    lines: [
      { k: "macd", color: "#2196f3" },
      { k: "signal", color: "#ff9800" },
      { k: "hist", type: "hist" },
    ],
    calc: (d, c) => calcMACD(d, c.f!, c.s!, c.g!),
  },
};

// ==========================================
// EXPORTS
// ==========================================

export const getIndicatorDefinition = (type: string): IndicatorDefinition | undefined => {
  return indicatorDefinitions[type.toLowerCase()];
};

export const getAvailableIndicators = (): string[] => {
  return Object.keys(indicatorDefinitions);
};

export const getOverlayIndicators = (): string[] => {
  return Object.entries(indicatorDefinitions)
    .filter(([, def]) => def.pane === "overlay")
    .map(([key]) => key);
};

export const getSeparatePaneIndicators = (): string[] => {
  return Object.entries(indicatorDefinitions)
    .filter(([, def]) => def.pane === "sep")
    .map(([key]) => key);
};

export default indicatorDefinitions;
