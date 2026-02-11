import { useState, useCallback } from "react";

export interface SidebarState {
  selectedTool: string;
  collapsed: boolean;
  magnetMode: boolean;
  drawingsLocked: boolean;
  drawingsHidden: boolean;
}

interface UseSidebarReturn extends SidebarState {
  setSelectedTool: (tool: string) => void;
  toggleCollapsed: () => void;
  toggleMagnetMode: () => void;
  toggleDrawingsLocked: () => void;
  toggleDrawingsHidden: () => void;
  deleteAllDrawings: () => void;
}

export function useSidebar(): UseSidebarReturn {
  const [selectedTool, setSelectedTool] = useState("crosshair");
  const [collapsed, setCollapsed] = useState(false);
  const [magnetMode, setMagnetMode] = useState(false);
  const [drawingsLocked, setDrawingsLocked] = useState(false);
  const [drawingsHidden, setDrawingsHidden] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed(prev => !prev), []);
  const toggleMagnetMode = useCallback(() => setMagnetMode(prev => !prev), []);
  const toggleDrawingsLocked = useCallback(() => setDrawingsLocked(prev => !prev), []);
  const toggleDrawingsHidden = useCallback(() => setDrawingsHidden(prev => !prev), []);

  const deleteAllDrawings = useCallback(() => {
    // This would clear drawings - for now just reset state
    console.log("Delete all drawings");
  }, []);

  return {
    selectedTool,
    collapsed,
    magnetMode,
    drawingsLocked,
    drawingsHidden,
    setSelectedTool,
    toggleCollapsed,
    toggleMagnetMode,
    toggleDrawingsLocked,
    toggleDrawingsHidden,
    deleteAllDrawings,
  };
}
