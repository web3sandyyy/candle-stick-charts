import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  MousePointer2,
  Crosshair,
  Eraser,
  TrendingUp,
  Minus,
  SeparatorVertical,
  MoveRight,
  ArrowLeftRight,
  ArrowRight,
  Waves,
  Square,
  Circle,
  Triangle,
  Type,
  MessageSquare,
  Brush,
  PenTool,
  Highlighter,
  Plus,
  Menu,
  Ruler,
  ArrowUpCircle,
  ArrowDownCircle,
  Magnet,
  Lock,
  EyeOff,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ConfirmDialog from "@/components/others/ConfirmDialog";

interface ToolItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface ToolGroup {
  id: string;
  label: string;
  tools: ToolItem[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "cursor",
    label: "Cursors",
    tools: [
      { id: "crosshair", icon: Crosshair, label: "Crosshair" },
      { id: "pointer", icon: MousePointer2, label: "Pointer" },
      { id: "eraser", icon: Eraser, label: "Eraser" },
    ],
  },
  {
    id: "line",
    label: "Lines",
    tools: [
      { id: "trendline", icon: TrendingUp, label: "Trend Line" },
      { id: "horizontal-line", icon: Minus, label: "Horizontal Line" },
      { id: "vertical-line", icon: SeparatorVertical, label: "Vertical Line" },
      { id: "ray", icon: MoveRight, label: "Ray" },
      { id: "extended-line", icon: ArrowLeftRight, label: "Extended Line" },
      { id: "horizontal-ray", icon: ArrowRight, label: "Horizontal Ray" },
      { id: "arrow", icon: ArrowRight, label: "Arrow" },
      { id: "parallel-channel", icon: Waves, label: "Parallel Channel" },
    ],
  },
  {
    id: "shape",
    label: "Shapes",
    tools: [
      { id: "rectangle", icon: Square, label: "Rectangle" },
      { id: "circle", icon: Circle, label: "Circle" },
      { id: "triangle", icon: Triangle, label: "Triangle" },
    ],
  },
  {
    id: "annotation",
    label: "Annotations",
    tools: [
      { id: "text", icon: Type, label: "Text" },
      { id: "callout", icon: MessageSquare, label: "Callout" },
      { id: "brush", icon: Brush, label: "Brush" },
      { id: "path", icon: PenTool, label: "Path" },
      { id: "highlighter", icon: Highlighter, label: "Highlighter" },
      { id: "cross-line", icon: Plus, label: "Cross Line" },
    ],
  },
  {
    id: "measurement",
    label: "Measurement",
    tools: [
      { id: "fib-retracement", icon: Menu, label: "Fibonacci" },
      { id: "price-range", icon: Ruler, label: "Price Range" },
      { id: "long-position", icon: ArrowUpCircle, label: "Long Position" },
      { id: "short-position", icon: ArrowDownCircle, label: "Short Position" },
    ],
  },
];

const UTILITY_TOOLS = [
  { id: "magnet", icon: Magnet, label: "Magnet Mode" },
  { id: "lock-all", icon: Lock, label: "Lock All" },
  { id: "hide-all", icon: EyeOff, label: "Hide All" },
  { id: "delete-all", icon: Trash2, label: "Delete All" },
];

interface LeftSidebarProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  magnetMode: boolean;
  toggleMagnetMode: () => void;
  drawingsLocked: boolean;
  toggleDrawingsLocked: () => void;
  drawingsHidden: boolean;
  toggleDrawingsHidden: () => void;
  deleteAllDrawings: () => void;
}

export const LeftSidebar = ({
  selectedTool,
  setSelectedTool,
  collapsed,
  toggleCollapsed,
  magnetMode,
  toggleMagnetMode,
  drawingsLocked,
  toggleDrawingsLocked,
  drawingsHidden,
  toggleDrawingsHidden,
  deleteAllDrawings,
}: LeftSidebarProps) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    setExpandedGroup(null);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  const handleUtilityClick = (toolId: string) => {
    switch (toolId) {
      case "magnet":
        toggleMagnetMode();
        break;
      case "lock-all":
        toggleDrawingsLocked();
        break;
      case "hide-all":
        toggleDrawingsHidden();
        break;
      case "delete-all":
        setShowDeleteDialog(true);
        break;
    }
  };

  const handleConfirmDeleteAll = () => {
    deleteAllDrawings();
    setShowDeleteDialog(false);
  };

  const isUtilityActive = (toolId: string) => {
    if (toolId === "magnet") return magnetMode;
    if (toolId === "lock-all") return drawingsLocked;
    if (toolId === "hide-all") return drawingsHidden;
    return false;
  };

  const getSelectedToolFromGroup = (group: ToolGroup): ToolItem => {
    const selected = group.tools.find(t => t.id === selectedTool);
    return selected || group.tools[0];
  };

  const isGroupActive = (group: ToolGroup): boolean => {
    return group.tools.some(t => t.id === selectedTool);
  };

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={toggleCollapsed}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-md p-1 shadow-md hover:bg-gray-50 transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-3 h-3 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative min-h-full w-11 border-r border-gray-200 bg-white flex flex-col py-3">
        {/* Main Tool Groups */}
        <div className="flex-1 flex flex-col gap-1 px-1">
          {TOOL_GROUPS.map(group => {
            const isActive = isGroupActive(group);
            const activeToolInGroup = getSelectedToolFromGroup(group);
            const IconComponent = activeToolInGroup.icon;

            return (
              <div key={group.id} className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded transition-all relative",
                        isActive
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                      {/* Dropdown indicator */}
                      <ChevronDown className="w-2 h-2 absolute bottom-0.5 right-0.5 opacity-50" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {activeToolInGroup.label}
                  </TooltipContent>
                </Tooltip>

                {/* Expanded Dropdown */}
                {expandedGroup === group.id && (
                  <div className="absolute left-full top-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-48 py-1">
                    <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-200 mb-1">
                      {group.label}
                    </div>
                    {group.tools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className={cn(
                          "w-full px-3 py-2 flex items-center gap-3 transition-colors text-sm",
                          selectedTool === tool.id
                            ? "bg-blue-500/20 text-blue-600"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <tool.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{tool.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-7 h-px bg-gray-200 my-3 mx-auto" />

        {/* Utility Tools - Bottom Section */}
        <div className="flex flex-col gap-1 px-1">
          {UTILITY_TOOLS.map(tool => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleUtilityClick(tool.id)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded transition-all",
                    isUtilityActive(tool.id)
                      ? "bg-purple-500/20 text-purple-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <tool.icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Collapse button */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
          title="Collapse sidebar"
        >
          <ChevronRight className="w-3 h-3 text-gray-600 rotate-180" />
        </button>

        {/* Delete All Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleConfirmDeleteAll}
          title="Delete All Drawings"
          description="Are you sure you want to delete all drawings? This action cannot be undone."
          confirmText="Delete All"
          cancelText="Cancel"
          icon={Trash2}
          confirmClassName="bg-red-500 hover:bg-red-600 text-white"
        />
      </div>
    </TooltipProvider>
  );
};

export default LeftSidebar;
