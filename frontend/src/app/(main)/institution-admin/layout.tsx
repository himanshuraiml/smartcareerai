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
    GraduationCap,
    Briefcase
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { href: "/institution-admin", icon: BarChart, label: "Overview" },
    { href: "/institution-admin/students", icon: Users, label: "Students" },
    { href: "/institution-admin/jobs", icon: Briefcase, label: "Job Approvals" },
    { href: "/institution-admin/settings", icon: Settings, label: "Settings" },
];

export default function InstitutionAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isAuthorized = !!user && user.role === "INSTITUTION_ADMIN";

    useEffect(() => {
        if (!user) {
            router.push("/login");
        } else if (user.role !== "INSTITUTION_ADMIN") {
            router.push("/dashboard");
        }
    }, [user, router]);

    // Close mobile menu on route change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMobileMenuOpen(false);
    }, [pathname]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] flex items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-teal-500 animate-spin flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#05070A] text-gray-900 dark:text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30">
            {/* Topbar */}
            <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Desktop Nav Area */}
                        <div className="flex items-center gap-8">
                            <Link href="/institution-admin" className="flex items-center gap-3 group shrink-0">
                                <Image
                                    src="/logo-new-light.png"
                                    alt="PlaceNxt Logo"
                                    width={200}
                                    height={50}
                                    className="h-14 w-auto block dark:hidden"
                                    priority
                                />
                                <Image
                                    src="/logo-new-dark.png"
                                    alt="PlaceNxt Logo"
                                    width={200}
                                    height={50}
                                    className="h-14 w-auto hidden dark:block"
                                    priority
                                />
                                <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500/30 pl-3">
                                    Institution
                                </span>
                            </Link>

                            {/* Desktop Nav */}
                            <nav className="hidden md:flex items-center gap-2">
                                {navItems.map((item) => {
                                    const isActive = item.href === "/institution-admin"
                                        ? pathname === item.href
                                        : pathname?.startsWith(`${item.href}`);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group"
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"
                                                    transition={{ type: "spring" as const, bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <item.icon className={`relative z-10 w-4 h-4 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-500'}`} />
                                            <span className={`relative z-10 font-bold text-[14px] transition-colors ${isActive
                                                ? "text-emerald-700 dark:text-emerald-400"
                                                : "text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                                                }`}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Desktop Profile & Actions */}
                        <div className="hidden md:flex items-center gap-5">
                            <div className="flex items-center gap-3 pl-5 border-l border-gray-200 dark:border-white/10">
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                        {user?.name || "Institution Admin"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                        {user?.email}
                                    </p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-inner overflow-hidden border-2 border-white dark:border-gray-800 shrink-0">
                                    {user?.avatarUrl ? (
                                        <Image src={user.avatarUrl} alt="Avatar" width={36} height={36} className="object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-sm">
                                            {user?.name?.charAt(0).toUpperCase() || "I"}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 -mr-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Slide-out Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-[#0B0F19] shadow-2xl z-50 flex flex-col md:hidden"
                        >
                            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                                <span className="font-bold text-gray-900 dark:text-white">Navigation</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                                {navItems.map((item) => {
                                    const isActive = item.href === "/institution-admin"
                                        ? pathname === item.href
                                        : pathname?.startsWith(`${item.href}`);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                                                : 'text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-gray-50 dark:bg-white/[0.02]">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-white dark:border-gray-800 shrink-0">
                                        <span className="text-white font-bold">{user?.name?.charAt(0).toUpperCase() || "I"}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || "Institution Admin"}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors"
                                >
                                    <LogOut className="w-5 h-5 mx-0" />
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main content area */}
            <main className="flex-1 relative w-full">
                <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
