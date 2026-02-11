import { useRef, useState, useMemo } from "react";
import {
  CandleStickChart,
  type ChartRef,
  type OHLCVData,
  type ChartStyle,
  type ChartAppearance,
  DEFAULT_CHART_APPEARANCE,
} from "./components/charts/candlestickchart";
import { IndicatorPickerModal, AppearanceModal, type SelectedIndicator } from "./components/modals";
// import { LeftSidebar } from "./components/sidebar";
import { useSidebar } from "./hooks/useSidebar";
import { Settings, TrendingUp, Camera } from "lucide-react";
import "./App.css";

// Generate sample OHLCV data
const generateSampleData = (days: number = 100): OHLCVData[] => {
  const data: OHLCVData[] = [];
  const startDate = new Date("2025-01-01").getTime() / 1000;
  let lastClose = 150;

  for (let i = 0; i < days; i++) {
    const time = startDate + i * 86400; // Add days in seconds
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * lastClose;
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * lastClose;
    const low = Math.min(open, close) - Math.random() * volatility * lastClose;
    const volume = Math.floor(Math.random() * 1000000 + 500000);

    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    lastClose = close;
  }

  return data;
};

function App() {
  const chartRef = useRef<ChartRef>(null);

  // Chart data
  const data = useMemo(() => generateSampleData(200), []);

  // Sidebar state
  const sidebar = useSidebar();

  // Modal states
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false);

  // Chart settings state
  const [chartStyle, setChartStyle] = useState<ChartStyle>("candlestick");
  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>([]);
  const [indicatorIdCounter, setIndicatorIdCounter] = useState(1);

  // Appearance state
  const [appearance, setAppearance] = useState<ChartAppearance>(DEFAULT_CHART_APPEARANCE);

  // Crosshair data
  const [hoverData, setHoverData] = useState<OHLCVData | null>(null);

  // Add indicator
  const handleAddIndicator = (indicatorName: string) => {
    if (chartRef.current?.addIndicator) {
      const chartIndicatorId = chartRef.current.addIndicator(indicatorName.toLowerCase());
      if (chartIndicatorId) {
        const newIndicator: SelectedIndicator = {
          id: indicatorIdCounter,
          indicator: indicatorName,
          params: {},
          color: "#2196f3",
        };
        setSelectedIndicators(prev => [...prev, newIndicator]);
        setIndicatorIdCounter(prev => prev + 1);
      }
    }
  };

  // Remove indicator
  const handleRemoveIndicator = (id: number) => {
    const indicator = selectedIndicators.find(i => i.id === id);
    if (indicator && chartRef.current?.removeIndicator) {
      // Find the chart indicator ID (we stored the indicator name, need to find corresponding chart ID)
      const chartIndicators = chartRef.current.getIndicators();
      const matchingIndicator = chartIndicators.find(chartId => 
        chartId.toLowerCase().startsWith(indicator.indicator.toLowerCase())
      );
      if (matchingIndicator) {
        chartRef.current.removeIndicator(matchingIndicator);
      }
    }
    setSelectedIndicators(prev => prev.filter(i => i.id !== id));
  };

  // Clear all indicators
  const handleClearAll = () => {
    if (chartRef.current?.clearIndicators) {
      chartRef.current.clearIndicators();
    }
    setSelectedIndicators([]);
  };

  // Take screenshot
  const handleScreenshot = () => {
    const dataUrl = chartRef.current?.takeScreenshot();
    if (dataUrl) {
      const link = document.createElement("a");
      link.download = "chart-screenshot.png";
      link.href = dataUrl;
      link.click();
    }
  };

  // Format indicator label
  const formatIndicatorLabel = (indicator: SelectedIndicator) => {
    return indicator.indicator;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-300 bg-white">
        <div className="px-3 py-2 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">Candlestick Chart</h1>
          <button
            onClick={handleScreenshot}
            className="p-1 hover:bg-gray-100 transition-colors"
            title="Screenshot"
          >
            <Camera className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {/* <LeftSidebar
          selectedTool={sidebar.selectedTool}
          setSelectedTool={sidebar.setSelectedTool}
          collapsed={sidebar.collapsed}
          toggleCollapsed={sidebar.toggleCollapsed}
          magnetMode={sidebar.magnetMode}
          toggleMagnetMode={sidebar.toggleMagnetMode}
          drawingsLocked={sidebar.drawingsLocked}
          toggleDrawingsLocked={sidebar.toggleDrawingsLocked}
          drawingsHidden={sidebar.drawingsHidden}
          toggleDrawingsHidden={sidebar.toggleDrawingsHidden}
          deleteAllDrawings={sidebar.deleteAllDrawings}
        /> */}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Toolbar */}
          <div className="px-2 py-1 bg-gray-50 border-b border-gray-300 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIndicatorModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium transition-colors"
              >
                <TrendingUp className="w-3 h-3" />
                Indicators
                {selectedIndicators.length > 0 && (
                  <span className="ml-1 px-1 text-xs bg-gray-400 text-white">
                    {selectedIndicators.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAppearanceModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 border border-gray-300 hover:bg-gray-100 text-sm font-medium transition-colors"
              >
                <Settings className="w-3 h-3" />
                Appearance
              </button>
            </div>

            {/* Active Indicators Tags */}
            {selectedIndicators.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {selectedIndicators.slice(0, 5).map(ind => (
                  <span
                    key={ind.id}
                    className="inline-flex items-center gap-1 px-1 py-0.5 text-xs font-medium bg-gray-200 text-gray-700"
                  >
                    {ind.color && (
                      <span
                        className="w-2 h-2"
                        style={{ backgroundColor: ind.color }}
                      />
                    )}
                    {ind.indicator}
                    <button
                      onClick={() => handleRemoveIndicator(ind.id)}
                      className="ml-0.5 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedIndicators.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{selectedIndicators.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* OHLC Display */}
          <div className="px-2 py-1 bg-white border-b border-gray-300 flex gap-4 text-xs">
            <span><b className="text-gray-500">O:</b> {hoverData?.open.toFixed(2) ?? '0.00'}</span>
            <span><b className="text-gray-500">H:</b> {hoverData?.high.toFixed(2) ?? '0.00'}</span>
            <span><b className="text-gray-500">L:</b> {hoverData?.low.toFixed(2) ?? '0.00'}</span>
            <span><b className="text-gray-500">C:</b> {hoverData?.close.toFixed(2) ?? '0.00'}</span>
            <span><b className="text-gray-500">Vol:</b> {hoverData?.volume?.toLocaleString() ?? '0'}</span>
          </div>

          {/* Chart */}
          <div className="overflow-hidden bg-white">
            <CandleStickChart
              ref={chartRef}
              data={data}
              chartStyle={chartStyle}
              appearance={appearance}
              options={{
                height: 550,
                showVolume: appearance.showVolume,
                showGrid: appearance.showGrid,
                theme: "light",
              }}
              onCrosshairMove={setHoverData}
              className="w-full"
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <IndicatorPickerModal
        open={indicatorModalOpen}
        onOpenChange={setIndicatorModalOpen}
        onSelectIndicator={handleAddIndicator}
        selectedIndicators={selectedIndicators}
        onRemoveIndicator={handleRemoveIndicator}
        onClearAll={handleClearAll}
        formatIndicatorLabel={formatIndicatorLabel}
      />

      <AppearanceModal
        open={appearanceModalOpen}
        onOpenChange={setAppearanceModalOpen}
        chartStyle={chartStyle}
        appearance={appearance}
        onChartStyleChange={setChartStyle}
        onAppearanceChange={setAppearance}
      />
    </div>
  );
}

export default App;
