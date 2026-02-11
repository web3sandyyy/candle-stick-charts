import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  createSeriesMarkers,
} from "lightweight-charts";
import type {
  OHLCVData,
  ChartMarker,
  ChartManagerOptions,
  IndicatorConfig,
  IndicatorInstance,
  ChartRef,
  CandleStickChartProps,
  ChartStyle,
} from "./types";
import { DEFAULT_CHART_APPEARANCE } from "./types";
import { getIndicatorDefinition } from "./indicators";
import { useTheme } from "@/lib/useTheme";
import {
  DEFAULT_OPTIONS,
  getColors,
  formatTimeIST,
  tickMarkFormatter,
} from "./helper";
import {
  CANDLE_COLORS,
  VOLUME_COLORS,
  CROSSHAIR_COLORS,
  INDICATOR_COLORS,
  getTooltipColors,
  getTooltipCssText,
  TOOLTIP_STYLES,
} from "./chartStyles";

const CandleStickChart = forwardRef<ChartRef, CandleStickChartProps>(
  (
    {
      options = {},
      data = [],
      markers = [],
      className = "",
      style = {},
      chartStyle,
      appearance,
      onCrosshairMove,
      showBuySellButtons = false,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartType, setChartType] = useState<
      "candlestick" | "line" | "bar" | "area"
    >("candlestick");

    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<any> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const indicatorsRef = useRef<Map<string, IndicatorInstance>>(new Map());
    const markersPrimitiveRef = useRef<any>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const dataRef = useRef<OHLCVData[]>([]);
    const dataHashRef = useRef<string>("");
    const priceSeriesRef = useRef<ISeriesApi<any> | null>(null);

    const { isDarkMode } = useTheme();

    const mergedOptionsRef = useRef<Required<ChartManagerOptions>>({
      ...DEFAULT_OPTIONS,
      ...options,
    });

    const resolvedAppearance = useMemo(
      () => ({
        ...DEFAULT_CHART_APPEARANCE,
        ...(appearance || {}),
      }),
      [appearance],
    );

    const resolveChartType = useCallback((style?: ChartStyle) => {
      switch (style) {
        case "line":
          return "line";
        case "area":
          return "area";
        case "bar":
          return "bar";
        case "heikin-ashi":
        case "candlestick":
        default:
          return "candlestick";
      }
    }, []);

    const hexToRgba = useCallback((hex: string, alpha: number) => {
      const normalized = hex.replace("#", "");
      if (normalized.length !== 6) return hex;
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }, []);

    // Update indicator data
    const updateIndicator = useCallback((id: string) => {
      const ind = indicatorsRef.current.get(id);
      if (!ind || !dataRef.current.length) return;
      try {
        const out = ind.def.calc(dataRef.current, ind.cfg);
        if (ind.def.render === "segments") {
          // Remove existing series
          if (Array.isArray(ind.series)) {
            ind.series.forEach((s) => chartRef.current?.removeSeries(s));
            ind.series.length = 0; // Clear array
          }

          // Create series for each segment
          if (ind.def.lines && Array.isArray(ind.series)) {
            const paneIndex = ind.isOverlay
              ? 0
              : [...indicatorsRef.current.values()]
                  .filter((x) => !x.isOverlay)
                  .indexOf(ind) + 1;

            ind.def.lines.forEach((lineConfig) => {
              const segments = out[lineConfig.k] || [];
              segments.forEach((segment: any[]) => {
                if (segment.length > 0 && chartRef.current) {
                  const series = chartRef.current.addSeries(
                    LineSeries,
                    {
                      color: lineConfig.color || INDICATOR_COLORS.default,
                      lineWidth: 2,
                      lineStyle: lineConfig.style || 0,
                      priceScaleId: ind.scaleId,
                      priceLineVisible: false,
                      lastValueVisible: false,
                      crosshairMarkerVisible: false,
                    },
                    paneIndex,
                  );
                  series.setData(segment);
                  (ind.series as ISeriesApi<any>[]).push(series);
                }
              });
            });
          }
        } else if (ind.def.render === "composite") {
          Object.keys(ind.series as Record<string, ISeriesApi<any>>).forEach(
            (k) => {
              if (out[k]) {
                (ind.series as Record<string, ISeriesApi<any>>)[k].setData(
                  out[k],
                );
              }
            },
          );
        } else {
          (ind.series as ISeriesApi<any>).setData(out);
        }
      } catch (e) {
        console.error(`Indicator ${id} calc error:`, e);
      }
    }, []);

    // Set chart data
    const setChartData = useCallback(
      (
        d: OHLCVData[],
        forcedType?: "candlestick" | "line" | "bar" | "area",
      ) => {
        // Create a simple hash to detect if data actually changed
        const newHash = `${d.length}-${d[0]?.time}-${d[d.length - 1]?.time}-${d[d.length - 1]?.close}`;
        const dataChanged = newHash !== dataHashRef.current;

        dataRef.current = d;
        dataHashRef.current = newHash;

        const candleData = d.filter(
          (x) =>
            typeof x.time === "number" &&
            typeof x.open === "number" &&
            typeof x.high === "number" &&
            typeof x.low === "number" &&
            typeof x.close === "number",
        );

        const lineData = d
          .filter(
            (x) => typeof x.time === "number" && typeof x.close === "number",
          )
          .map((x) => ({
            time: x.time as Time,
            value: x.close,
          }));

        if (priceSeriesRef.current) {
          const activeType = forcedType ?? chartType;
          if (activeType === "candlestick" || activeType === "bar") {
            priceSeriesRef.current.setData(candleData as any);
          } else {
            priceSeriesRef.current.setData(lineData);
          }
        }
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(
            candleData.map((x) => ({
              time: x.time as Time,
              value: x.volume || 0,
              color: x.close >= x.open ? VOLUME_COLORS.up : VOLUME_COLORS.down,
            })),
          );
        }

        // Only update indicators if data actually changed
        if (dataChanged) {
          indicatorsRef.current.forEach((_, k) => updateIndicator(k));
        }
      },
      [updateIndicator, chartType],
    );

    const recreatePriceSeries = useCallback(
      (type: "candlestick" | "line" | "bar" | "area") => {
        if (!chartRef.current) return;

        // Remove old series
        if (priceSeriesRef.current) {
          chartRef.current.removeSeries(priceSeriesRef.current);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let newSeries: ISeriesApi<any>;

        if (type === "candlestick") {
          newSeries = chartRef.current.addSeries(CandlestickSeries, {
            upColor: resolvedAppearance.upColor || CANDLE_COLORS.up,
            downColor: resolvedAppearance.downColor || CANDLE_COLORS.down,
            borderVisible: true,
            borderUpColor:
              resolvedAppearance.borderUpColor ||
              resolvedAppearance.upColor ||
              CANDLE_COLORS.up,
            borderDownColor:
              resolvedAppearance.borderDownColor ||
              resolvedAppearance.downColor ||
              CANDLE_COLORS.down,
            wickUpColor:
              resolvedAppearance.wickUpColor ||
              resolvedAppearance.upColor ||
              CANDLE_COLORS.up,
            wickDownColor:
              resolvedAppearance.wickDownColor ||
              resolvedAppearance.downColor ||
              CANDLE_COLORS.down,
          });
        } else if (type === "line") {
          newSeries = chartRef.current.addSeries(LineSeries, {
            color: resolvedAppearance.upColor || CANDLE_COLORS.up,
            lineWidth: 2,
          });
        } else if (type === "bar") {
          newSeries = chartRef.current.addSeries(BarSeries, {
            upColor: resolvedAppearance.upColor || CANDLE_COLORS.up,
            downColor: resolvedAppearance.downColor || CANDLE_COLORS.down,
          });
        } else {
          const upColor = resolvedAppearance.upColor || CANDLE_COLORS.up;
          newSeries = chartRef.current.addSeries(AreaSeries, {
            lineColor: upColor,
            topColor: hexToRgba(upColor, 0.35),
            bottomColor: hexToRgba(upColor, 0.05),
          });
        }

        priceSeriesRef.current = newSeries;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        seriesRef.current = newSeries as any;

        // Reapply data
        if (dataRef.current.length) {
          setChartData(dataRef.current, type);
        }
      },
      [setChartData, resolvedAppearance, hexToRgba],
    );

    // Set markers
    const setChartMarkers = useCallback((newMarkers: ChartMarker[]) => {
      if (!priceSeriesRef.current || !newMarkers || !newMarkers.length) return;

      const sorted = [...newMarkers].sort((a, b) => a.time - b.time);
      if (!createSeriesMarkers) return;

      if (!markersPrimitiveRef.current) {
        markersPrimitiveRef.current = createSeriesMarkers(
          priceSeriesRef.current,
          sorted as any,
        );
        return;
      }

      markersPrimitiveRef.current.setMarkers(sorted as any);
    }, []);

    // Clear markers
    const clearChartMarkers = useCallback(() => {
      if (markersPrimitiveRef.current) {
        markersPrimitiveRef.current.setMarkers([]);
      }
    }, []);

    // Add indicator
    const addIndicator = useCallback(
      (type: string, opts: IndicatorConfig = {}): string | null => {
        const def = getIndicatorDefinition(type);
        if (!def) {
          console.warn(`Indicator '${type}' not found`);
          return null;
        }

        const id = `${type}_${Date.now().toString(36)}`;
        const cfg = { ...def.defaults, ...opts };
        const isOverlay = def.pane === "overlay";
        // For separate panes, use "right" scale but in different pane
        const scaleId = "right";

        // Calculate pane index: 0 is main price chart, 1+ are separate panes
        const paneIndex = isOverlay
          ? 0
          : [...indicatorsRef.current.values()].filter((x) => !x.isOverlay)
              .length + 1;

        let series:
          | ISeriesApi<any>
          | Record<string, ISeriesApi<any>>
          | ISeriesApi<any>[];

        if (def.render === "segments" && def.lines) {
          series = [];
        } else if (def.render === "composite" && def.lines) {
          series = {};
          def.lines.forEach((l) => {
            const T = l.type === "hist" ? HistogramSeries : LineSeries;
            (series as Record<string, ISeriesApi<any>>)[l.k] =
              chartRef.current!.addSeries(
                T,
                {
                  color:
                    (cfg as any)[l.k + "Color"] ||
                    l.color ||
                    INDICATOR_COLORS.default,
                  ...(T === LineSeries && { lineWidth: l.width || 1 }),
                  lineStyle: l.style || 0,
                  priceScaleId: scaleId,
                  priceLineVisible: false,
                },
                paneIndex,
              );
          });
        } else {
          const T = def.render === "hist" ? HistogramSeries : LineSeries;
          series = chartRef.current!.addSeries(
            T,
            {
              color: cfg.color || INDICATOR_COLORS.default,
              lineWidth: 2,
              priceScaleId: scaleId,
              priceLineVisible: false,
            },
            paneIndex,
          );
        }

        indicatorsRef.current.set(id, {
          type,
          def,
          cfg,
          series,
          isOverlay,
          scaleId,
        });
        updateIndicator(id);
        return id;
      },
      [updateIndicator],
    );

    // Remove indicator
    const removeIndicator = useCallback((id: string) => {
      const ind = indicatorsRef.current.get(id);
      if (!ind) return;
      if (ind.def.render === "segments" && Array.isArray(ind.series)) {
        ind.series.forEach((s) => chartRef.current!.removeSeries(s));
      } else if (ind.def.render === "composite") {
        Object.values(ind.series as Record<string, ISeriesApi<any>>).forEach(
          (s) => chartRef.current!.removeSeries(s),
        );
      } else {
        chartRef.current!.removeSeries(ind.series as ISeriesApi<any>);
      }
      indicatorsRef.current.delete(id);

      // Trigger layout recalculation after removing series
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: mergedOptionsRef.current.height,
        });
      }
    }, []);

    // Clear all indicators
    const clearIndicators = useCallback(() => {
      [...indicatorsRef.current.keys()].forEach((id) => removeIndicator(id));
    }, [removeIndicator]);

    // Get indicator IDs
    const getIndicators = useCallback((): string[] => {
      return [...indicatorsRef.current.keys()];
    }, []);

    // Set theme
    const setTheme = useCallback(() => {
      const c = getColors(isDarkMode ? "dark" : "light");
      chartRef.current?.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: c.bg },
          textColor: c.text,
        },
      });
    }, [isDarkMode]);

    useEffect(() => {
      const desiredType = resolveChartType(chartStyle);
      if (desiredType !== chartType) {
        setChartType(desiredType);
        recreatePriceSeries(desiredType);
      }
    }, [chartStyle, resolveChartType, chartType, recreatePriceSeries]);

    useEffect(() => {
      if (!priceSeriesRef.current) return;
      if (chartType === "candlestick") {
        priceSeriesRef.current.applyOptions({
          upColor: resolvedAppearance.upColor || CANDLE_COLORS.up,
          downColor: resolvedAppearance.downColor || CANDLE_COLORS.down,
          borderUpColor:
            resolvedAppearance.borderUpColor ||
            resolvedAppearance.upColor ||
            CANDLE_COLORS.up,
          borderDownColor:
            resolvedAppearance.borderDownColor ||
            resolvedAppearance.downColor ||
            CANDLE_COLORS.down,
          wickUpColor:
            resolvedAppearance.wickUpColor ||
            resolvedAppearance.upColor ||
            CANDLE_COLORS.up,
          wickDownColor:
            resolvedAppearance.wickDownColor ||
            resolvedAppearance.downColor ||
            CANDLE_COLORS.down,
        } as any);
      } else if (chartType === "bar") {
        priceSeriesRef.current.applyOptions({
          upColor: resolvedAppearance.upColor || CANDLE_COLORS.up,
          downColor: resolvedAppearance.downColor || CANDLE_COLORS.down,
        } as any);
      } else if (chartType === "line") {
        priceSeriesRef.current.applyOptions({
          color: resolvedAppearance.upColor || CANDLE_COLORS.up,
        } as any);
      } else if (chartType === "area") {
        const upColor = resolvedAppearance.upColor || CANDLE_COLORS.up;
        priceSeriesRef.current.applyOptions({
          lineColor: upColor,
          topColor: hexToRgba(upColor, 0.35),
          bottomColor: hexToRgba(upColor, 0.05),
        } as any);
      }
    }, [resolvedAppearance, chartType, hexToRgba]);

    // Fit content
    const fitContent = useCallback(() => {
      chartRef.current?.timeScale().fitContent();
    }, []);

    // Take screenshot
    const takeScreenshot = useCallback((): string | null => {
      return chartRef.current?.takeScreenshot().toDataURL() || null;
    }, []);

    // Resize
    const resize = useCallback(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: mergedOptionsRef.current.height,
        });
      }
    }, []);

    // Get chart instance
    const getChart = useCallback(() => {
      return chartRef.current;
    }, []);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        setData: setChartData,
        setMarkers: setChartMarkers,
        clearMarkers: clearChartMarkers,
        addIndicator,
        removeIndicator,
        clearIndicators,
        getIndicators,
        setTheme,
        fitContent,
        takeScreenshot,
        resize,
        getChart,
        setChartType: (type: "candlestick" | "line" | "bar" | "area") => {
          setChartType(type);
          recreatePriceSeries(type);
        },
      }),
      [
        setChartData,
        setChartMarkers,
        clearChartMarkers,
        addIndicator,
        removeIndicator,
        clearIndicators,
        getIndicators,
        setTheme,
        fitContent,
        takeScreenshot,
        resize,
        getChart,
        recreatePriceSeries,
      ],
    );

    // Initialize chart
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const colors = getColors(isDarkMode ? "dark" : "light");
      const optionsRef = mergedOptionsRef.current;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: optionsRef.height,
        autoSize: optionsRef.autoSize,
        layout: {
          background: { type: ColorType.Solid, color: colors.bg },
          textColor: colors.text,
        },
        grid: {
          vertLines: { color: colors.grid, visible: optionsRef.showGrid },
          horzLines: { color: colors.grid, visible: optionsRef.showGrid },
        },
        rightPriceScale: {
          borderColor: colors.border,
          scaleMargins: { top: 0.02, bottom: 0.02 },
        },
        timeScale: {
          borderColor: colors.border,
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (time: number, tickMarkType?: number) =>
            tickMarkFormatter(time, tickMarkType, optionsRef.isIntraday),
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            labelBackgroundColor: CROSSHAIR_COLORS.labelBackground,
          },
          horzLine: {
            labelBackgroundColor: CROSSHAIR_COLORS.labelBackground,
          },
        },
        localization: {
          timeFormatter: (time: number) =>
            formatTimeIST(time, optionsRef.isIntraday),
        },
      });

      chartRef.current = chart;

      // Add candle series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: resolvedAppearance.upColor || CANDLE_COLORS.up,
        downColor: resolvedAppearance.downColor || CANDLE_COLORS.down,
        borderVisible: true,
        borderUpColor:
          resolvedAppearance.borderUpColor ||
          resolvedAppearance.upColor ||
          CANDLE_COLORS.up,
        borderDownColor:
          resolvedAppearance.borderDownColor ||
          resolvedAppearance.downColor ||
          CANDLE_COLORS.down,
        wickUpColor:
          resolvedAppearance.wickUpColor ||
          resolvedAppearance.upColor ||
          CANDLE_COLORS.up,
        wickDownColor:
          resolvedAppearance.wickDownColor ||
          resolvedAppearance.downColor ||
          CANDLE_COLORS.down,
      });

      priceSeriesRef.current = candleSeries;
      seriesRef.current = candleSeries;
      // Add volume series if needed
      if (optionsRef.showVolume) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: CANDLE_COLORS.up,
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
        chart.priceScale("vol").applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;
      }

      // Add tooltip
      const tooltip = document.createElement("div");
      tooltip.style.cssText = getTooltipCssText(isDarkMode);
      container.style.position = "relative";
      container.appendChild(tooltip);
      tooltipRef.current = tooltip;

      chart.subscribeCrosshairMove((p) => {
        if (!p.time || !p.point) {
          if (!showBuySellButtons) {
            tooltip.style.display = "none";
          }
          if (onCrosshairMove) {
            onCrosshairMove(null);
          }
          return;
        }
        const series = priceSeriesRef.current;
        const d = series
          ? (p.seriesData.get(series) as CandlestickData | { value: number })
          : null;
        if (d) {
          const timeNum = typeof p.time === "number" ? p.time : Number(p.time);
          const timeStr = formatTimeIST(timeNum, optionsRef.isIntraday);
          const timeLabel = optionsRef.isIntraday ? `${timeStr} IST` : timeStr;

          const isCandle = "open" in d;
          const valueLabel = isCandle
            ? `<b>O</b> ${(d as CandlestickData).open.toFixed(2)} <b>H</b> ${(d as CandlestickData).high.toFixed(2)} <b>L</b> ${(d as CandlestickData).low.toFixed(2)} <b>C</b> ${(d as CandlestickData).close.toFixed(2)}`
            : `<b>Value</b> ${(d as { value: number }).value.toFixed(2)}`;

          // Only show tooltip if showBuySellButtons is false
          if (!showBuySellButtons) {
            tooltip.style.display = "block";
            tooltip.innerHTML = `<div style="margin-bottom:4px;"><b>Time:</b> ${timeLabel}</div>${valueLabel}`;
            tooltip.style.left = `${Math.min(p.point.x + TOOLTIP_STYLES.offset.left, container.clientWidth - TOOLTIP_STYLES.offset.maxWidth)}px`;
            tooltip.style.top = `${p.point.y + TOOLTIP_STYLES.offset.top}px`;
          }

          // Call callback with hover data
          if (onCrosshairMove && isCandle) {
            const candleData = d as CandlestickData;
            onCrosshairMove({
              time: timeNum,
              open: candleData.open,
              high: candleData.high,
              low: candleData.low,
              close: candleData.close,
            });
          }
        }
      });

      // Setup resize observer
      const resizeObserver = new ResizeObserver(() => {
        chart.applyOptions({
          width: container.clientWidth,
          height: optionsRef.height,
        });
      });
      resizeObserver.observe(container);

      // Capture ref for cleanup
      const indicators = indicatorsRef.current;

      // Cleanup
      return () => {
        resizeObserver.disconnect();
        tooltipRef.current?.remove();
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        volumeSeriesRef.current = null;
        indicators.clear();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const nextOptions = { ...DEFAULT_OPTIONS, ...options };
      if (appearance?.showGrid !== undefined) {
        nextOptions.showGrid = appearance.showGrid;
      }
      if (appearance?.showVolume !== undefined) {
        nextOptions.showVolume = appearance.showVolume;
      }

      const prevOptions = mergedOptionsRef.current;
      mergedOptionsRef.current = nextOptions;

      if (!chartRef.current) return;

      const colors = getColors(isDarkMode ? "dark" : "light");
      chartRef.current.applyOptions({
        height: nextOptions.height,
        autoSize: nextOptions.autoSize,
        grid: {
          vertLines: { color: colors.grid, visible: nextOptions.showGrid },
          horzLines: { color: colors.grid, visible: nextOptions.showGrid },
        },
        timeScale: {
          tickMarkFormatter: (time: number, tickMarkType?: number) =>
            tickMarkFormatter(time, tickMarkType, nextOptions.isIntraday),
        },
        localization: {
          timeFormatter: (time: number) =>
            formatTimeIST(time, nextOptions.isIntraday),
        },
      });

      if (nextOptions.showVolume && !volumeSeriesRef.current) {
        const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
          color: CANDLE_COLORS.up,
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
        chartRef.current.priceScale("vol").applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });
        volumeSeriesRef.current = volumeSeries;
        if (dataRef.current.length) {
          setChartData(dataRef.current);
        }
      }

      if (!nextOptions.showVolume && volumeSeriesRef.current) {
        chartRef.current.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }

      if (prevOptions.height !== nextOptions.height && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: nextOptions.height,
        });
      }
    }, [options, appearance, isDarkMode, setChartData]);
    // Update theme colors when isDarkMode changes
    useEffect(() => {
      if (!chartRef.current) return;

      const colors = getColors(isDarkMode ? "dark" : "light");

      // Update chart layout colors
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: colors.bg },
          textColor: colors.text,
        },
        grid: {
          vertLines: {
            color: colors.grid,
            visible: mergedOptionsRef.current.showGrid,
          },
          horzLines: {
            color: colors.grid,
            visible: mergedOptionsRef.current.showGrid,
          },
        },
        rightPriceScale: {
          borderColor: colors.border,
        },
        timeScale: {
          borderColor: colors.border,
        },
      });

      // Update tooltip colors
      if (tooltipRef.current) {
        const tooltipColors = getTooltipColors(isDarkMode);
        tooltipRef.current.style.background = tooltipColors.background;
        tooltipRef.current.style.color = tooltipColors.text;
        tooltipRef.current.style.borderColor = tooltipColors.border;
      }
    }, [isDarkMode]);
    // Update data when prop changes
    useEffect(() => {
      if (data.length > 0) {
        setChartData(data);
      }
    }, [data, setChartData]);

    // Update markers when prop changes
    useEffect(() => {
      if (markers.length > 0) {
        setChartMarkers(markers);
      } else {
        clearChartMarkers();
      }
    }, [markers, setChartMarkers, clearChartMarkers]);

    return <div ref={containerRef} className={className} style={style} />;
  },
);

CandleStickChart.displayName = "CandleStickChart";

export default CandleStickChart;

// Re-export types for convenience
export type { ChartRef, CandleStickChartProps } from "./types";
