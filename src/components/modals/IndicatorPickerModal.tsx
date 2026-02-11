import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Check, LineChart } from "lucide-react";
import {
  PlotlyIndicators,
  INDICATOR_CATEGORY_CONFIG,
  FEATURED_INDICATORS,
  getCategoryForIndicator,
} from "@/constants/indicators";
import { cn } from "@/lib/utils";

type SelectedIndicator = {
  id: number;
  indicator: string;
  params: Record<string, number | string>;
  visible?: boolean;
  color?: string;
};

interface IndicatorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIndicator: (indicator: string) => void;
  selectedIndicators?: SelectedIndicator[];
  onRemoveIndicator?: (id: number) => void;
  onClearAll?: () => void;
  formatIndicatorLabel?: (indicator: SelectedIndicator) => string;
}

export function IndicatorPickerModal({
  open,
  onOpenChange,
  onSelectIndicator,
  selectedIndicators = [],
  onRemoveIndicator,
  onClearAll,
  formatIndicatorLabel,
}: IndicatorPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredIndicators = PlotlyIndicators.filter(item =>
    item.indicator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (indicator: string) => {
    onSelectIndicator(indicator);
    setSearchQuery("");
  };

  const isIndicatorSelected = (indicator: string) => {
    return selectedIndicators.some(ind => ind.indicator.toLowerCase() === indicator.toLowerCase());
  };

  const groupedIndicators = filteredIndicators.reduce(
    (acc, item) => {
      const category = getCategoryForIndicator(item.indicator);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, typeof PlotlyIndicators>
  );

  // Filter by active category if selected
  const displayedCategories = activeCategory
    ? { [activeCategory]: groupedIndicators[activeCategory] || [] }
    : groupedIndicators;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85dvh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Technical Indicators</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Add indicators to analyze price movements and trends
              </p>
            </div>
            <div className="flex items-end justify-end md:items-center gap-2">
              <span className="text-xs text-gray-400">
                {PlotlyIndicators.length} available
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search indicators (e.g., RSI, MACD, Bollinger)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-10 bg-white border-gray-200 focus-visible:ring-gray-400 text-sm"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Applied Indicators Section */}
        {selectedIndicators.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-700 animate-pulse" />
                <h3 className="text-xs font-semibold text-gray-700">
                  Active Indicators
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">
                  {selectedIndicators.length}
                </span>
              </div>
              {onClearAll && selectedIndicators.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
              {selectedIndicators.map(ind => (
                <div
                  key={ind.id}
                  className="group inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 shadow-sm hover:shadow transition-shadow"
                >
                  {ind.color && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ind.color }}
                    />
                  )}
                  <span className="text-gray-800">
                    {formatIndicatorLabel ? formatIndicatorLabel(ind) : ind.indicator}
                  </span>
                  {onRemoveIndicator && (
                    <button
                      onClick={() => onRemoveIndicator(ind.id)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors opacity-60 group-hover:opacity-100"
                      title="Remove"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="px-6 py-2 border-b border-gray-200 overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  !activeCategory
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                All
              </button>
              {Object.entries(INDICATOR_CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
                      activeCategory === key
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Indicators List */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(34dvh - 10px)" }}>
          {/* Featured Section (only when no search and no category filter) */}
          {!searchQuery && !activeCategory && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Popular
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="flex flex-wrap gap-2">
                {FEATURED_INDICATORS.map(indicator => {
                  const selected = isIndicatorSelected(indicator);
                  return (
                    <button
                      key={indicator}
                      onClick={() => !selected && handleSelect(indicator)}
                      disabled={selected}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selected
                          ? "bg-gray-200 text-gray-500 cursor-default"
                          : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {selected && <Check className="w-3 h-3" />}
                        {indicator}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categorized View */}
          {searchQuery === "" ? (
            <div className="px-6 py-4 space-y-5">
              {Object.entries(displayedCategories).map(([category, indicators]) => {
                if (!indicators || indicators.length === 0) return null;
                const config = INDICATOR_CATEGORY_CONFIG[category] || {
                  icon: LineChart,
                  label: category,
                  description: "",
                };
                const Icon = config.icon;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-100">
                        <Icon className="w-3.5 h-3.5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold text-gray-800">
                          {config.label}
                        </h3>
                        <p className="text-[10px] text-gray-400">
                          {config.description}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {indicators.length} indicators
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {indicators.map(item => {
                        const selected = isIndicatorSelected(item.indicator);
                        return (
                          <button
                            key={item.id}
                            onClick={() => !selected && handleSelect(item.indicator)}
                            disabled={selected}
                            className={cn(
                              "text-left px-3 py-2 rounded-md text-sm transition-all relative group",
                              selected
                                ? "bg-gray-100 text-gray-500 border border-gray-200"
                                : "text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                            )}
                          >
                            <span className="flex items-center justify-between">
                              <span className="truncate">{item.indicator}</span>
                              {selected && <Check className="w-3 h-3 flex-shrink-0 ml-1" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filteredIndicators.length > 0 ? (
            // Search Results
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">
                  {filteredIndicators.length} results for "{searchQuery}"
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {filteredIndicators.map(item => {
                  const selected = isIndicatorSelected(item.indicator);
                  const category = getCategoryForIndicator(item.indicator);
                  const config = INDICATOR_CATEGORY_CONFIG[category];

                  return (
                    <button
                      key={item.id}
                      onClick={() => !selected && handleSelect(item.indicator)}
                      disabled={selected}
                      className={cn(
                        "text-left px-3 py-2.5 rounded-md transition-all",
                        selected
                          ? "bg-gray-100 text-gray-500 border border-gray-200"
                          : "text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{item.indicator}</span>
                        {selected && <Check className="w-3 h-3 flex-shrink-0 ml-1" />}
                      </div>
                      {config && (
                        <span className="text-[10px] text-gray-400">
                          {config.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // No Results
            <div className="px-6 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                No indicators found for "{searchQuery}"
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching with a different term
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              Click an indicator to add it to your chart
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

export type { SelectedIndicator };
