// Chart Color Configuration
// Centralized color definitions for candlestick charts

export const CANDLE_COLORS = {
  up: "#26a69a",
  down: "#ef5350",
} as const;

export const VOLUME_COLORS = {
  up: "rgba(38,166,154,0.3)",
  down: "rgba(239,83,80,0.3)",
} as const;

export const CROSSHAIR_COLORS = {
  labelBackground: "#2962FF",
} as const;

export const INDICATOR_COLORS = {
  default: "#2196f3",
} as const;

export const TOOLTIP_COLORS = {
  light: {
    background: "#ffffff",
    text: "#1a1a1a",
    border: "#e5e7eb",
  },
  dark: {
    background: "#1a1a1a",
    text: "#ffffff",
    border: "#2a2e39",
  },
} as const;

// Helper function to get tooltip colors based on theme
export const getTooltipColors = (isDarkMode: boolean) => {
  return isDarkMode ? TOOLTIP_COLORS.dark : TOOLTIP_COLORS.light;
};

// Watermark Styles
export const WATERMARK_STYLES = {
  container: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none" as const,
    zIndex: "1",
    opacity: "0.1",
  },
  image: {
    width: "150px",
    height: "auto",
  },
} as const;

export const getWatermarkFilter = (isDarkMode: boolean) => {
  return `grayscale(100%)${isDarkMode ? "" : " invert(1)"}`;
};

// Tooltip Styles
export const TOOLTIP_STYLES = {
  base: {
    position: "absolute" as const,
    display: "none",
    padding: "8px",
    fontSize: "12px",
    zIndex: "100",
    borderWidth: "1px",
    borderStyle: "solid" as const,
    borderRadius: "4px",
    pointerEvents: "none" as const,
    fontFamily: "monospace",
  },
  offset: {
    left: 12,
    top: 12,
    maxWidth: 200,
  },
} as const;

// Helper to build tooltip CSS string
export const getTooltipCssText = (isDarkMode: boolean) => {
  const colors = getTooltipColors(isDarkMode);
  const base = TOOLTIP_STYLES.base;
  return `position:${base.position};display:${base.display};padding:${base.padding};font-size:${base.fontSize};z-index:${base.zIndex};background:${colors.background};color:${colors.text};border:1px solid ${colors.border};border-radius:${base.borderRadius};pointer-events:${base.pointerEvents};font-family:${base.fontFamily};`;
};

// Helper to build watermark CSS string
export const getWatermarkCssText = () => {
  const w = WATERMARK_STYLES.container;
  return `position:${w.position};top:${w.top};left:${w.left};transform:${w.transform};pointer-events:${w.pointerEvents};z-index:${w.zIndex};opacity:${w.opacity};`;
};

// Helper to build watermark image CSS string
export const getWatermarkImageCssText = (isDarkMode: boolean) => {
  const img = WATERMARK_STYLES.image;
  return `width:${img.width};height:${img.height};filter:${getWatermarkFilter(isDarkMode)};`;
};

// Combined export for convenience
export const getChartColors = (isDarkMode: boolean) => ({
  candle: CANDLE_COLORS,
  volume: VOLUME_COLORS,
  crosshair: CROSSHAIR_COLORS,
  indicator: INDICATOR_COLORS,
  tooltip: getTooltipColors(isDarkMode),
});
