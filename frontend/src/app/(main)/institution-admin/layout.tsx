"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Users,
    BarChart,
    Settings,
    LogOut,
    Menu,
    X,
    GraduationCap
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
    { href: "/institution-admin", icon: BarChart, label: "Dashboard" },
    { href: "/institution-admin/students", icon: Users, label: "Students" },
    { href: "/institution-admin/settings", icon: Settings, label: "Settings" },
];

export default function InstitutionAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isAuthorized = !!user && user.role === "INSTITUTION_ADMIN";

    useEffect(() => {
        if (!user) {
            router.push("/login");
        } else if (user.role !== "INSTITUTION_ADMIN") {
            router.push("/dashboard");
        }
    }, [user, router]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0B0F19] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0F19] text-gray-900 dark:text-white flex">
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
                        <Link href="/institution-admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                                Institution Portal
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                                        ${isActive
                                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-gray-900 dark:text-white border border-emerald-500/30"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white dark:bg-white/5"}
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User info */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/5">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-white/5 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden">
                                {user?.avatarUrl ? (
                                    <Image src={user.avatarUrl} alt="Avatar" width={40} height={40} className="object-cover" />
                                ) : (
                                    <span className="text-white font-medium">
                                        {user?.name?.charAt(0).toUpperCase() || "I"}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "Institution Admin"}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 lg:ml-0 overflow-y-auto h-screen">
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
                            <GraduationCap className="w-5 h-5 text-emerald-500" />
                            <span className="font-bold text-gray-900 dark:text-white">Institution Portal</span>
                        </div>
                        <div className="w-6" />
                    </div>
                </header>

                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}



