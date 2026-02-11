import { useEffect, useState, useCallback, useMemo } from "react";

type Theme = "light" | "dark" | "system";

const getIsDarkMode = (theme: Theme): boolean => {
  if (typeof window === "undefined") return false;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const isDarkMode = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return systemPrefersDark;
  }, [theme, systemPrefersDark]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    const dark = getIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? "light" : "dark";
    setTheme(newTheme);
  }, [isDarkMode, setTheme]);

  // Initialize and listen for system preference changes
  useEffect(() => {
    // Apply initial theme
    document.documentElement.classList.toggle("dark", isDarkMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, isDarkMode]);

  return {
    theme,
    isDarkMode,
    isLightMode: !isDarkMode,
    setTheme,
    toggleTheme,
    setLightMode: () => setTheme("light"),
    setDarkMode: () => setTheme("dark"),
    setSystemMode: () => setTheme("system"),
  };
};

// Helper function for non-React contexts
export const getTheme = () => {
  if (typeof window === "undefined") {
    return { theme: "system" as Theme, isDarkMode: false, isLightMode: true };
  }
  const stored = localStorage.getItem("theme") as Theme;
  const isDarkMode =
    stored === "dark" ||
    (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return {
    theme: stored || "system",
    isDarkMode,
    isLightMode: !isDarkMode,
  };
};
