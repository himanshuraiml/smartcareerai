"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    GraduationCap,
    Briefcase,
    CalendarDays,
    TrendingUp,
    Activity,
    Building2,
    Brain,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    MonitorPlay,
    Phone,
    LayoutGrid,
    ShieldCheck,
    Sun,
    Moon,
    MessageSquare,
    FileBarChart2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";
import { useTheme } from "@/providers/ThemeProvider";
import { safeEffectStateUpdate } from "@/lib/purity-helpers";
import Logo from "@/components/layout/Logo";

// Grouped navigation matching the target design
const navGroups = [
    {
        label: "CORE",
        items: [
            { href: "/institution-admin", icon: LayoutGrid, label: "Overview" },
            { href: "/institution-admin/students", icon: Users, label: "Students", badgeKey: "students" },
            { href: "/institution-admin/drives", icon: CalendarDays, label: "Drives", badgeKey: "drives" },
            { href: "/institution-admin/jobs", icon: Briefcase, label: "Job Marketplace" },
            { href: "/institution-admin/placements", icon: TrendingUp, label: "Placements" },
        ],
    },
    {
        label: "OPERATIONS",
        items: [
            { href: "/institution-admin/operations", icon: MonitorPlay, label: "War Room" },
            { href: "/institution-admin/broadcast", icon: Phone, label: "Broadcast" },
            { href: "/institution-admin/partners", icon: Building2, label: "Corporate CRM" },
            { href: "/institution-admin/roles", icon: ShieldCheck, label: "Roles & Access" },
        ],
    },
    {
        label: "INTELLIGENCE",
        items: [
            { href: "/institution-admin/analytics", icon: BarChart3, label: "Analytics" },
            { href: "/institution-admin/reports", icon: FileBarChart2, label: "Reports" },
            { href: "/institution-admin/skill-gaps", icon: Activity, label: "Skill Readiness" },
            { href: "/institution-admin/intelligence", icon: Brain, label: "AI Intelligence" },
        ],
    },
];

const SidebarContent = ({
    sidebarOpen,
    setMobileMenuOpen,
    isActive,
    badges,
    institutionProfile,
    expandedGroups,
    toggleGroup
}: {
    sidebarOpen: boolean;
    setMobileMenuOpen: (o: boolean) => void;
    isActive: (h: string) => boolean;
    badges: Record<string, string | number>;
    institutionProfile?: any;
    expandedGroups: string[];
    toggleGroup: (label: string) => void;
}) => (
    <>
        {/* Logo Area */}
        <div className={`h-[68px] flex items-center ${sidebarOpen ? "px-5" : "justify-center"} border-b border-white/[0.06]`}>
            <Link href="/institution-admin" className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"} overflow-hidden min-w-0`}>
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0 shadow-lg overflow-hidden p-1">
                    {institutionProfile?.logoUrl ? (
                        <img src={institutionProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col min-w-0"
                    >
                        <Logo width={100} height={33} variant="dark" />
                    </motion.div>
                )}
            </Link>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto pt-5 pb-2 custom-scrollbar no-scrollbar">
            {navGroups.map((group, groupIdx) => {
                const isExpanded = expandedGroups.includes(group.label);
                return (
                    <div key={group.label} className={groupIdx > 0 ? "mt-2" : ""}>
                        {/* Section divider (not for first group) */}
                        {groupIdx > 0 && (
                            <div className="mx-5 mb-3 border-t border-white/[0.06]" />
                        )}

                        {/* Section header */}
                        {sidebarOpen && (
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className="w-full px-5 mb-2 flex items-center justify-between group/header"
                            >
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 group-hover/header:text-gray-300 transition-colors">
                                    {group.label}
                                </span>
                                <ChevronDown
                                    className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"
                                        }`}
                                />
                            </button>
                        )}

                        {/* Nav items */}
                        <AnimatePresence initial={false}>
                            {(isExpanded || !sidebarOpen) && (
                                <motion.div
                                    initial={sidebarOpen ? { height: 0, opacity: 0 } : undefined}
                                    animate={sidebarOpen ? { height: "auto", opacity: 1 } : undefined}
                                    exit={sidebarOpen ? { height: 0, opacity: 0 } : undefined}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="px-3 space-y-0.5 overflow-hidden"
                                >
                                    {group.items.map((item) => {
                                        const active = isActive(item.href);
                                        const badgeValue = item.badgeKey ? badges[item.badgeKey] : null;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${active
                                                    ? "bg-teal-600/[0.1] text-teal-400"
                                                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
                                                    }`}
                                            >
                                                {/* Left active indicator */}
                                                {active && (
                                                    <motion.div
                                                        layoutId="nav-indicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-teal-500"
                                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                    />
                                                )}

                                                <item.icon
                                                    className={`w-[18px] h-[18px] shrink-0 ${active ? "text-teal-400" : "text-gray-500 group-hover:text-gray-300"
                                                        }`}
                                                    strokeWidth={active ? 2.2 : 1.7}
                                                />

                                                {sidebarOpen ? (
                                                    <span className={`text-[15px] flex-1 ${active ? "font-bold" : "font-medium"}`}>
                                                        {item.label}
                                                    </span>
                                                ) : (
                                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
                                                        {item.label}
                                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                                                    </div>
                                                )}

                                                {/* Badge */}
                                                {badgeValue && sidebarOpen && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeKey === "students"
                                                        ? "bg-amber-500/20 text-amber-400"
                                                        : "bg-teal-600/20 text-teal-400"
                                                        }`}>
                                                        {badgeValue}
                                                    </span>
                                                )}
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
    </>
);

export default function InstitutionAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["CORE"]);
    const [badges, setBadges] = useState<Record<string, string | number>>({});
    const [institutionProfile, setInstitutionProfile] = useState<any>(null);
    const isAuthorized = !!user && user.role === "INSTITUTION_ADMIN";

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

    useEffect(() => {
        if (!user) {
            router.push("/login");
        } else if (user.role !== "INSTITUTION_ADMIN") {
            router.push("/dashboard");
        }
    }, [user, router]);

    // Fetch badge counts and profile
    const fetchData = useCallback(async () => {
        try {
            const [studentsRes, drivesRes, profileRes] = await Promise.all([
                authFetch("/university/students?limit=1"),
                authFetch("/university/drives?limit=1"),
                authFetch("/university/settings"),
            ]);
            const newBadges: Record<string, string | number> = {};
            if (studentsRes.ok) {
                const d = await studentsRes.json();
                const total = d.data?.pagination?.total || d.pagination?.total || 0;
                newBadges.students = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total;
            }
            if (drivesRes.ok) {
                const d = await drivesRes.json();
                const total = d.data?.pagination?.total || d.pagination?.total || d.data?.length || 0;
                if (total > 0) newBadges.drives = total;
            }
            setBadges(newBadges);

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setInstitutionProfile(profileData.data);
            }
        } catch {
            // non-critical
        }
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            safeEffectStateUpdate(() => fetchData());
        }
    }, [isAuthorized, fetchData]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-teal-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-teal-500" />
                    </div>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const isActive = (href: string) =>
        href === "/institution-admin"
            ? pathname === href
            : pathname?.startsWith(href);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#070B14] text-gray-900 dark:text-gray-100 flex font-sans selection:bg-teal-600/30" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
            {/* Sidebar Overlay (Mobile) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#0A0E1A] transition-all duration-300 ease-in-out flex flex-col border-r border-white/[0.04] ${sidebarOpen ? "w-[260px]" : "w-[68px]"
                    } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            >
                <SidebarContent
                    sidebarOpen={sidebarOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                    isActive={isActive}
                    badges={badges}
                    institutionProfile={institutionProfile}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                />

                {/* Toggle Sidebar Button (Desktop) */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden lg:flex absolute -right-3 top-[30px] w-6 h-6 rounded-full bg-[#141924] border border-white/[0.08] items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-[60]"
                >
                    {sidebarOpen ? <ChevronLeft className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                </button>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Desktop Top Header */}
                <header className="hidden lg:flex h-[68px] items-center justify-between px-8 bg-white dark:bg-[#0A0E1A] border-b border-gray-100 dark:border-white/[0.04] shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {institutionProfile?.logoUrl ? (
                            <img src={institutionProfile.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                        ) : (
                            <GraduationCap className="w-4 h-4 text-teal-500" />
                        )}
                        Institutional Admin
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Messages Link/Toggle */}
                        <button
                            onClick={() => {
                                if (pathname?.startsWith('/institution-admin/messages')) {
                                    router.back();
                                } else {
                                    router.push('/institution-admin/messages');
                                }
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border ${pathname?.startsWith('/institution-admin/messages')
                                ? 'bg-teal-500/10 border-teal-500/20 text-teal-500'
                                : 'bg-gray-100 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.06] text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                }`}
                            title={pathname?.startsWith('/institution-admin/messages') ? "Close Messages" : "Messages"}
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        >
                            {theme === "dark"
                                ? <Sun className="w-4 h-4 text-amber-400" />
                                : <Moon className="w-4 h-4 text-indigo-500" />
                            }
                        </button>

                        {/* User Account Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 p-1 pl-3 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] transition-all hover:border-teal-500/30">
                                <div className="flex flex-col items-end mr-1">
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 leading-none">
                                        {user?.name?.split(' ')[0] || "Admin"}
                                    </span>
                                    <span className="text-[9px] text-gray-500 dark:text-gray-500 font-medium mt-0.5">
                                        TPO
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0 shadow-md">
                                    {user?.avatarUrl ? (
                                        <Image src={user.avatarUrl} alt="Avatar" width={32} height={32} className="object-cover rounded-lg" />
                                    ) : (
                                        <span className="text-[10px] font-black text-white">
                                            {(user?.name || "A").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu - Added pt-2 bridging to prevent instant closing */}
                            <div className="absolute right-0 top-full pt-2 w-48 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-[100]">
                                <div className="py-2 bg-white dark:bg-[#0F1424] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/[0.04] mb-1">
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        href="/institution-admin/settings"
                                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile Top Header */}
                <header className="lg:hidden h-14 flex items-center justify-between px-5 bg-[#0A0E1A] border-b border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shrink-0 overflow-hidden">
                            {institutionProfile?.logoUrl ? (
                                <img src={institutionProfile.logoUrl} alt="Logo" className="w-full h-full object-contain p-1 bg-white" />
                            ) : (
                                <GraduationCap className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <Logo width={80} height={26} variant="dark" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-all active:scale-90"
                        >
                            {theme === "dark"
                                ? <Sun className="w-4 h-4 text-amber-400" />
                                : <Moon className="w-4 h-4 text-indigo-400" />
                            }
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-rose-400 transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                        >
                            <Menu className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar dark:bg-[#070B14]/60">
                    <div className="max-w-[1400px] mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={pathname}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
