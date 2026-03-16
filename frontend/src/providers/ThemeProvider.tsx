"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "dark" | "light";
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "system",
    resolvedTheme: "dark",
    toggleTheme: () => { },
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

const emptySubscribe = () => () => { };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );

    const systemTheme = useSyncExternalStore<"dark" | "light">(
        (callback) => {
            if (typeof window === "undefined") return () => { };
            const mq = window.matchMedia("(prefers-color-scheme: dark)");
            mq.addEventListener("change", callback);
            return () => mq.removeEventListener("change", callback);
        },
        () => {
            if (typeof window === "undefined") return "dark";
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        },
        () => "dark"
    );

    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return "system";
        return (localStorage.getItem("placenxt_theme") as Theme) || "system";
    });

    // Derive resolved theme purely
    const resolvedTheme: "dark" | "light" = theme === "system" ? systemTheme : (theme as "dark" | "light");

    // Synchronize DOM with the derived theme
    useEffect(() => {
        if (isMounted) {
            const root = document.documentElement;
            if (resolvedTheme === "dark") {
                root.classList.add("dark");
            } else {
                root.classList.remove("dark");
            }
        }
    }, [resolvedTheme, isMounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("placenxt_theme", newTheme);
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    // Prevent hydration mismatch
    if (!isMounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
