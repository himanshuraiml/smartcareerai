"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Command, ArrowUp, ArrowDown, CornerDownLeft, X } from "lucide-react";

interface ShortcutCommand {
    key: string;
    label: string;
    action: () => void;
    category: string;
}

export default function KeyboardShortcuts() {
    const router = useRouter();
    const pathname = usePathname();
    const [showPalette, setShowPalette] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const commands: ShortcutCommand[] = [
        { key: "g d", label: "Go to Dashboard", action: () => router.push("/dashboard"), category: "Navigation" },
        { key: "g r", label: "Go to Resumes", action: () => router.push("/dashboard/resumes"), category: "Navigation" },
        { key: "g s", label: "Go to Skills", action: () => router.push("/dashboard/skills"), category: "Navigation" },
        { key: "g t", label: "Go to Tests", action: () => router.push("/dashboard/tests"), category: "Navigation" },
        { key: "g i", label: "Go to Interviews", action: () => router.push("/dashboard/interviews"), category: "Navigation" },
        { key: "g j", label: "Go to Jobs", action: () => router.push("/dashboard/jobs"), category: "Navigation" },
        { key: "g b", label: "Go to Billing", action: () => router.push("/dashboard/billing"), category: "Navigation" },
        { key: "g p", label: "Go to Pricing", action: () => router.push("/pricing"), category: "Navigation" },
        { key: "n r", label: "New Resume Upload", action: () => router.push("/dashboard/resumes?action=upload"), category: "Actions" },
        { key: "n t", label: "Start New Test", action: () => router.push("/dashboard/tests?action=new"), category: "Actions" },
        { key: "n i", label: "Start Interview", action: () => router.push("/dashboard/interviews?action=new"), category: "Actions" },
        { key: "?", label: "Show Keyboard Shortcuts", action: () => setShowPalette(true), category: "Help" },
    ];

    const filteredCommands = commands.filter(
        (cmd) =>
            cmd.label.toLowerCase().includes(search.toLowerCase()) ||
            cmd.key.toLowerCase().includes(search.toLowerCase())
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Open command palette with Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setShowPalette((prev) => !prev);
                return;
            }

            // ? for help
            if (e.key === "?" && !showPalette) {
                e.preventDefault();
                setShowPalette(true);
                return;
            }

            // Escape to close
            if (e.key === "Escape") {
                setShowPalette(false);
                setSearch("");
                return;
            }

            // Navigate with arrow keys in palette
            if (showPalette) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                        setShowPalette(false);
                        setSearch("");
                    }
                }
            }
        },
        [showPalette, filteredCommands, selectedIndex, router]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    // Close palette on route change
    useEffect(() => {
        setShowPalette(false);
        setSearch("");
    }, [pathname]);

    return (
        <AnimatePresence>
            {showPalette && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[200]"
                        onClick={() => setShowPalette(false)}
                    />

                    {/* Command Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-lg"
                    >
                        <div className="rounded-2xl glass-premium border border-white/10 overflow-hidden shadow-2xl">
                            {/* Search Input */}
                            <div className="flex items-center gap-3 p-4 border-b border-white/10">
                                <Command className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Type a command or search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={() => setShowPalette(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Commands List */}
                            <div className="max-h-80 overflow-y-auto p-2">
                                {filteredCommands.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">No commands found</div>
                                ) : (
                                    filteredCommands.map((cmd, index) => (
                                        <button
                                            key={cmd.key}
                                            onClick={() => {
                                                cmd.action();
                                                setShowPalette(false);
                                                setSearch("");
                                            }}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg transition ${index === selectedIndex
                                                    ? "bg-purple-500/20 text-white"
                                                    : "text-gray-300 hover:bg-white/5"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm">{cmd.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{cmd.category}</span>
                                                <kbd className="px-2 py-1 rounded bg-white/10 text-xs font-mono text-gray-400">
                                                    {cmd.key}
                                                </kbd>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-3 border-t border-white/10 text-xs text-gray-500">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <ArrowUp className="w-3 h-3" />
                                        <ArrowDown className="w-3 h-3" />
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CornerDownLeft className="w-3 h-3" />
                                        Select
                                    </span>
                                </div>
                                <span>ESC to close</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
