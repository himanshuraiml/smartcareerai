"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Briefcase,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
    Bookmark,
    Building,
    ChevronLeft,
    ChevronRight,
    Bell
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
    { href: "/recruiter", icon: Search, label: "Find Candidates" },
    { href: "/recruiter/saved", icon: Bookmark, label: "Saved Candidates" },
    { href: "/recruiter/jobs", icon: Briefcase, label: "Job Postings" },
    { href: "/recruiter/messages", icon: MessageSquare, label: "Messages" },
    { href: "/recruiter/profile", icon: Building, label: "Company Profile" },
    { href: "/recruiter/settings", icon: Settings, label: "Settings" },
];

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const isAuthorized = !!user && (user.role === "RECRUITER" || user.role === "ADMIN");

    useEffect(() => {
        if (!user) {
            router.push("/login?redirect=/recruiter");
        } else if (user.role !== "RECRUITER" && user.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [user, router]);

    // Handle scroll for mobile header shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSidebarOpen(false);
    }, [pathname]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-indigo-500 animate-spin flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs animate-pulse">Authenticating...</p>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] text-gray-900 dark:text-white flex selection:bg-blue-500/30">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50 flex flex-col
                    bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/5
                    transform transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-2xl lg:shadow-none
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    ${collapsed ? "w-20" : "w-64"}
                `}
            >
                {/* Logo Area */}
                <div className="flex items-center justify-between p-6">
                    <Link href="/recruiter" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center"
                            >
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
                            </motion.div>
                        )}
                    </Link>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 -mr-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 lg:hidden transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-4 py-4 overflow-y-auto no-scrollbar flex flex-col gap-1.5">
                    <div className="px-3 mb-2">
                        {!collapsed && (
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Menu
                            </p>
                        )}
                        {collapsed && <div className="h-4 border-b border-gray-200 dark:border-white/5 mx-2" />}
                    </div>

                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/recruiter" && pathname?.startsWith(`${item.href}/`));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex items-center px-3 py-3 rounded-xl transition-colors group"
                                title={collapsed ? item.label : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="recruiter-sidebar-active"
                                        className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring" as const, stiffness: 350, damping: 30 }}
                                    />
                                )}

                                <div className={`relative z-10 flex items-center ${collapsed ? "justify-center w-full" : "gap-3.5"}`}>
                                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`} />
                                    {!collapsed && (
                                        <span className={`font-bold text-[15px] transition-colors ${isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile Footer */}
                <div className="p-4 mt-auto">
                    <div className="p-1 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} p-2 rounded-xl`}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <span className="text-white font-bold text-lg">{user?.name?.charAt(0).toUpperCase()}</span>
                            </div>

                            {!collapsed && (
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-[15px] font-bold text-gray-900 dark:text-white truncate lg:max-w-[120px]">{user?.name}</p>
                                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase truncate">Recruiter</p>
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
                            >
                                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Sign Out
                            </button>
                        )}

                        {collapsed && (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center mt-2 p-3 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#050505] relative">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                {/* Mobile Header */}
                <header
                    className={`
                        lg:hidden sticky top-0 z-30 transition-all duration-300
                        ${scrolled
                            ? "bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm"
                            : "bg-transparent"}
                    `}
                >
                    <div className="flex items-center justify-between px-4 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">Portal</span>
                        </div>

                        <button className="p-2 -mr-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-[#0A0A0A]" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 w-full">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
