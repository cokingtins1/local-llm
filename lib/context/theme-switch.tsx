"use client";
import React from "react";
import { useTheme } from "./theme-context";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeSwitch() {
	const { theme, toggleTheme } = useTheme();

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={toggleTheme}
			className="gap-2"
		>
			{theme === "light" ? (
				<>
					<Moon className="h-4 w-4 text-primary" />
					Dark
				</>
			) : (
				<>
					<Sun className="h-4 w-4 text-primary" />
					Light
				</>
			)}
		</Button>
	);
}
