"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => { },
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("placenxt_theme") as Theme;
        if (savedTheme) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;

        if (newTheme === "light") {
            root.style.setProperty("--background", "0 0% 98%");
            root.style.setProperty("--foreground", "0 0% 10%");
            root.style.setProperty("--card", "0 0% 100%");
            root.style.setProperty("--card-foreground", "0 0% 10%");
            root.style.setProperty("--muted", "0 0% 90%");
            root.style.setProperty("--muted-foreground", "0 0% 40%");
            root.classList.add("light-mode");
            root.classList.remove("dark-mode", "dark");
        } else {
            root.style.setProperty("--background", "0 0% 3.9%");
            root.style.setProperty("--foreground", "0 0% 98%");
            root.style.setProperty("--card", "0 0% 7%");
            root.style.setProperty("--card-foreground", "0 0% 98%");
            root.style.setProperty("--muted", "0 0% 14.9%");
            root.style.setProperty("--muted-foreground", "0 0% 63.9%");
            root.classList.add("dark-mode", "dark");
            root.classList.remove("light-mode");
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);
        localStorage.setItem("placenxt_theme", newTheme);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
