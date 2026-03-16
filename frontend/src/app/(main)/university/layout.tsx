// src/app/(main)/university/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    BarChart,
    Users,
    Briefcase,
    Calendar,
    GraduationCap,
    TrendingUp,
    Settings,
    LogOut,
    Menu,
    X,
    Building2,
    Activity,
    BookOpen,
    Brain,
    FileText,
    MessageSquare,
    ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Logo from "@/components/layout/Logo";

const navGroups = [
    {
        label: "CORE",
        items: [
            { href: "/university", icon: BarChart, label: "Analytics Overview" },
            { href: "/university/students", icon: Users, label: "Students" },
            { href: "/university/drives", icon: Calendar, label: "Placement Drives" },
            { href: "/university/jobs", icon: Briefcase, label: "Job Marketplace" },
            { href: "/university/placements", icon: TrendingUp, label: "Placements" },
        ],
    },
    {
        label: "OPERATIONS",
        items: [
            { href: "/university/broadcast", icon: Activity, label: "Broadcast Hub" },
            { href: "/university/partners", icon: Building2, label: "Corporate CRM" },
            { href: "/university/messages", icon: MessageSquare, label: "Messages" },
        ],
    },
    {
        label: "INTELLIGENCE",
        items: [
            { href: "/university/analytics", icon: BarChart, label: "Advanced Analytics" },
            { href: "/university/skill-gaps", icon: Activity, label: "Skill Readiness" },
            { href: "/university/intelligence", icon: Brain, label: "AI Intelligence" },
            { href: "/university/reports", icon: FileText, label: "Compliance & Reports" },
        ],
    },
    {
        label: "CONFIGURATION",
        items: [
            { href: "/university/policy", icon: Settings, label: "Placement Policy" },
            { href: "/university/settings", icon: Settings, label: "General Settings" },
        ],
    },
];

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["CORE"]);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    // Check if user is an institution admin
    const isAuthorized = !!user && user.role === "UNIVERSITY_ADMIN";

    useEffect(() => {
        if (!user) {
            router.push("/login");
        } else if (user.role !== "UNIVERSITY_ADMIN") {
            router.push("/dashboard");
        }
    }, [user, router]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#070B14] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#070B14] text-gray-900 dark:text-white flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 glass border-r border-gray-200 dark:border-white/5
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between">
                        <Link href="/university" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <Logo width={100} height={33} />
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
                        {navGroups.map((group) => {
                            const isExpanded = expandedGroups.includes(group.label);
                            return (
                                <div key={group.label} className="space-y-1">
                                    <button
                                        onClick={() => toggleGroup(group.label)}
                                        className="w-full px-4 py-2 flex items-center justify-between group/header"
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover/header:text-gray-300 transition-colors">
                                            {group.label}
                                        </span>
                                        <ChevronDown
                                            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="space-y-1 overflow-hidden"
                                            >
                                                {group.items.map((item) => {
                                                    const isActive = pathname === item.href || (pathname?.startsWith(`${item.href}/`) && item.href !== '/university');
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setSidebarOpen(false)}
                                                            className={`
                                                                flex items-center gap-3 px-4 py-2 rounded-xl transition-all
                                                                ${isActive
                                                                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}
                                                            `}
                                                        >
                                                            <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                                            <span className="font-medium text-[15px]">{item.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Admin User info */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-white/5 mb-3 border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-medium text-lg">
                                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-hidden h-screen">
                {/* Desktop header */}
                <header className="hidden lg:flex items-center justify-between px-8 py-5 glass border-b border-gray-200 dark:border-white/5 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize leading-tight">
                                {pathname === '/university' ? 'University Analytics Dashboard' : pathname?.split('/').pop()?.replace(/-/g, ' ') || 'University Portal'}
                            </h1>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Institutional insights and placement tracking
                            </p>
                        </div>
                    </div>
                    <ThemeToggle />
                </header>

                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 glass border-b border-gray-200 dark:border-white/5">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-500" />
                            <Logo width={80} height={26} />
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
