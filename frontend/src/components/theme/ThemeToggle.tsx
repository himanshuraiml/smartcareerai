"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors" />
            ) : (
                <Moon className="w-5 h-5 text-gray-600 hover:text-purple-500 transition-colors" />
            )}
        </button>
    );
}
