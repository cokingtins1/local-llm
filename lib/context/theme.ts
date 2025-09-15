import { Theme } from "./theme-context";

// Simple theme utilities without AG Grid dependencies
export const getThemeClass = (theme: Theme) => {
	return theme === "dark" ? "dark" : "light";
};

// Hook to get the current theme configuration
export const useCurrentTheme = (): Theme => {
	if (typeof window === "undefined") {
		return "light";
	}

	const isDark = document.documentElement.classList.contains("dark");
	return isDark ? "dark" : "light";
};

// Utility to apply theme classes to elements
export const applyTheme = (theme: Theme, element?: HTMLElement) => {
	const target = element || document.documentElement;
	
	if (theme === "dark") {
		target.classList.add("dark");
		target.classList.remove("light");
	} else {
		target.classList.add("light");
		target.classList.remove("dark");
	}
};