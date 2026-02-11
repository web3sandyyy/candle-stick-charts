import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Grid3X3,
  ChartBar,
  ChartCandlestick,
  LineChart,
  AreaChart,
  Check,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartAppearance, ChartStyle } from "@/components/charts/candlestickchart/types";
import { DEFAULT_CHART_APPEARANCE } from "@/components/charts/candlestickchart/types";

interface AppearanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartStyle: ChartStyle;
  appearance: ChartAppearance;
  onChartStyleChange: (style: ChartStyle) => void;
  onAppearanceChange: (appearance: ChartAppearance) => void;
}

const CHART_STYLE_OPTIONS: { id: ChartStyle; label: string }[] = [
  { id: "candlestick", label: "Candles" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "bar", label: "Bars" },
];

const CHART_STYLE_ICONS: Record<ChartStyle, typeof ChartCandlestick> = {
  candlestick: ChartCandlestick,
  line: LineChart,
  area: AreaChart,
  bar: ChartBar,
  "heikin-ashi": ChartCandlestick,
};

interface ColorPickerInlineProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPickerInline = ({ color, onChange, label }: ColorPickerInlineProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm text-gray-700">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer bg-transparent"
          style={{ padding: 0 }}
        />
        <span className="text-xs text-gray-500 font-mono uppercase">
          {color}
        </span>
      </div>
    </div>
  );
};

export function AppearanceModal({
  open,
  onOpenChange,
  chartStyle,
  appearance,
  onChartStyleChange,
  onAppearanceChange,
}: AppearanceModalProps) {
  const handleReset = () => {
    onChartStyleChange("candlestick");
    onAppearanceChange(DEFAULT_CHART_APPEARANCE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85dvh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Chart Appearance</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize how your chart looks
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Chart Style */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Chart Style
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CHART_STYLE_OPTIONS.map(style => {
                const Icon = CHART_STYLE_ICONS[style.id];
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      onChartStyleChange(style.id);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border transition-all",
                      chartStyle === style.id
                        ? "bg-gray-100 border-gray-300 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{style.label}</span>
                    {chartStyle === style.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candle Colors */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Candle Colors
            </h3>
            <div className="space-y-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <ColorPickerInline
                color={appearance.upColor}
                onChange={c => onAppearanceChange({ ...appearance, upColor: c })}
                label="Up Candle"
              />
              <div className="h-px bg-gray-200" />
              <ColorPickerInline
                color={appearance.downColor}
                onChange={c => onAppearanceChange({ ...appearance, downColor: c })}
                label="Down Candle"
              />
              <div className="h-px bg-gray-200" />
              <ColorPickerInline
                color={appearance.wickUpColor}
                onChange={c => onAppearanceChange({ ...appearance, wickUpColor: c })}
                label="Wick Up"
              />
              <div className="h-px bg-gray-200" />
              <ColorPickerInline
                color={appearance.wickDownColor}
                onChange={c => onAppearanceChange({ ...appearance, wickDownColor: c })}
                label="Wick Down"
              />
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Display Options
            </h3>
            <div className="space-y-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center">
                    <Grid3X3 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-800">Grid Lines</Label>
                    <p className="text-[10px] text-gray-400">Show chart grid</p>
                  </div>
                </div>
                <Switch
                  checked={appearance.showGrid}
                  onCheckedChange={checked =>
                    onAppearanceChange({ ...appearance, showGrid: checked })
                  }
                />
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center">
                    <ChartBar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-800">Volume</Label>
                    <p className="text-[10px] text-gray-400">Show volume bars</p>
                  </div>
                </div>
                <Switch
                  checked={appearance.showVolume}
                  onCheckedChange={checked =>
                    onAppearanceChange({ ...appearance, showVolume: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              Changes apply immediately
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
