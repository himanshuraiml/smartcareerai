// src/app/(main)/university/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    BarChart,
    Users,
    Briefcase,
    GraduationCap,
    TrendingUp,
    Settings,
    LogOut,
    Menu,
    X,
    Building2,
    Activity,
    BookOpen
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import ThemeToggle from "@/components/theme/ThemeToggle";

const navItems = [
    { href: "/university", icon: BarChart, label: "Analytics Overview" },
    { href: "/university/students", icon: Users, label: "Students" },
    { href: "/university/placements", icon: Briefcase, label: "Placements" },
    { href: "/university/skill-gaps", icon: Activity, label: "Skill Gaps" },
    { href: "/university/departments", icon: Building2, label: "Departments" },
    { href: "/university/market-trends", icon: TrendingUp, label: "Market Trends" },
    { href: "/university/settings", icon: Settings, label: "Settings" },
];

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white flex">
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
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-600">
                                Uni Portal
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (pathname?.startsWith(`${item.href}/`) && item.href !== '/university');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive
                                            ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"}
                  `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Admin User info */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-white/5 mb-3 border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
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
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
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
                            <GraduationCap className="w-5 h-5 text-violet-500" />
                            <span className="font-bold text-gray-900 dark:text-white">Uni Portal</span>
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
