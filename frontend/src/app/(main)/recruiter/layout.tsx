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
    Bell,
    User,
    ClipboardList,
    BarChart2,
    TrendingUp,
    Globe,
    Link2,
    GraduationCap,
    Plug,
    Download,
    ChevronDown,
    Video,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import Logo from "@/components/layout/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { authFetch } from "@/lib/auth-fetch";



const navGroups = [
    {
        label: "SOURCING",
        items: [
            { href: "/recruiter", icon: Search, label: "Find Candidates" },
            { href: "/recruiter/saved", icon: Bookmark, label: "Saved Candidates" },
            { href: "/recruiter/drives", icon: GraduationCap, label: "Campus Drives" },
        ],
    },
    {
        label: "RECRUITMENT",
        items: [
            { href: "/recruiter/jobs", icon: Briefcase, label: "Job Postings" },
            { href: "/recruiter/scorecards", icon: ClipboardList, label: "Scorecards" },
            { href: "/recruiter/messages", icon: MessageSquare, label: "Messages" },
        ],
    },
    {
        label: "ANALYTICS",
        items: [
            { href: "/recruiter/analytics/diversity", icon: BarChart2, label: "D&I Analytics" },
            { href: "/recruiter/analytics/market", icon: Globe, label: "Market Intel" },
            { href: "/recruiter/hire-quality", icon: TrendingUp, label: "Hire Quality" },
            { href: "/recruiter/meetings/analytics", icon: Video, label: "Meeting AI" },
        ],
    },
    {
        label: "CONFIGURATION",
        items: [
            { href: "/recruiter/settings", icon: Settings, label: "Organization Settings" },
            { href: "/recruiter/integrations", icon: Plug, label: "Integrations" },
        ],
    },
];


export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(navGroups.map(g => g.label));
    const [scrolled, setScrolled] = useState(false);
    const [orgProfile, setOrgProfile] = useState<any>(null);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const isAuthorized = !!user && (user.role === "RECRUITER" || user.role === "ADMIN");


    useEffect(() => {
        if (!user) {
            router.push("/login?redirect=/recruiter");
        } else if (user.role !== "RECRUITER" && user.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [user, router]);

    // Fetch Organization Profile
    useEffect(() => {
        if (isAuthorized) {
            const fetchOrg = async () => {
                try {
                    const res = await authFetch("/organization/my");
                    if (res.ok) {
                        const data = await res.json();
                        setOrgProfile(data.data);
                    }
                } catch {
                    // Non-critical
                }
            };
            fetchOrg();
        }
    }, [isAuthorized]);


    // F19: Request push notification permission and subscribe
    useEffect(() => {
        if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        async function setupPush() {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const reg = await navigator.serviceWorker.ready;
                const existing = await reg.pushManager.getSubscription();
                if (existing) return; // already subscribed

                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: vapidKey,
                });

                const { endpoint, keys } = sub.toJSON() as any;
                await authFetch('/recruiter/push-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint, keys }),
                });
            } catch {
                // Non-critical — ignore push setup failures
            }
        }
        setupPush();
    }, [user]);

    // F19: Capture beforeinstallprompt and show banner after 5 visits
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const visits = parseInt(localStorage.getItem('pn_recruiter_visits') || '0') + 1;
        localStorage.setItem('pn_recruiter_visits', String(visits));

        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            if (visits >= 5 && !localStorage.getItem('pn_install_dismissed')) {
                setShowInstallBanner(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
        setShowInstallBanner(false);
    };

    const dismissInstallBanner = () => {
        localStorage.setItem('pn_install_dismissed', '1');
        setShowInstallBanner(false);
    };

    // Handle scroll for mobile header shadow
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label)
                ? prev.filter(g => g !== label)
                : [...prev, label]
        );
    };

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
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] flex items-center justify-center shrink-0 shadow-lg overflow-hidden p-1">
                            {orgProfile?.logoUrl ? (
                                <img src={orgProfile.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center"
                            >
                                <Logo width={140} height={46} />
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
                <div className="flex-1 px-4 py-4 overflow-y-auto no-scrollbar flex flex-col gap-6">
                    {navGroups.map((group, groupIdx) => {
                        const isExpanded = expandedGroups.includes(group.label);
                        return (
                            <div key={group.label} className="flex flex-col gap-1.5">
                                {/* Section Header */}
                                {!collapsed && (
                                    <button
                                        onClick={() => toggleGroup(group.label)}
                                        className="w-full px-3 mb-1 flex items-center justify-between group/header"
                                    >
                                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover/header:text-gray-900 dark:group-hover/header:text-gray-300 transition-colors">
                                            {group.label}
                                        </p>
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"
                                                }`}
                                        />
                                    </button>
                                )}

                                <AnimatePresence initial={false}>
                                    {(isExpanded || collapsed) && (
                                        <motion.div
                                            initial={!collapsed ? { height: 0, opacity: 0 } : undefined}
                                            animate={!collapsed ? { height: "auto", opacity: 1 } : undefined}
                                            exit={!collapsed ? { height: 0, opacity: 0 } : undefined}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="space-y-0.5 overflow-hidden"
                                        >
                                            {group.items.map((item) => {
                                                const isActive = pathname === item.href || (item.href !== "/recruiter" && pathname?.startsWith(`${item.href}/`));

                                                return (
                                                    <button
                                                        key={item.href}
                                                        onClick={() => {
                                                            if (pathname === item.href) {
                                                                router.back();
                                                            } else {
                                                                router.push(item.href);
                                                            }
                                                        }}
                                                        className="relative w-full flex items-center px-3 py-2.5 rounded-xl transition-colors group text-left"
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
                                                        <div className={`relative z-10 flex items-center ${collapsed ? "justify-center w-full" : "gap-3"}`}>
                                                            <item.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`} />
                                                            {!collapsed && (
                                                                <span className={`font-bold text-[15px] transition-colors ${isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                                                                    {item.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>


                <div className="p-4 mt-auto">
                    {/* Profile moved to Header */}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#050505] relative">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                {/* Desktop Top Header */}
                <header className="hidden lg:flex h-[68px] items-center justify-between px-8 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shrink-0 z-20 transition-all">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {orgProfile?.logoUrl ? (
                            <img src={orgProfile.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                        ) : (
                            <Briefcase className="w-4 h-4 text-blue-500" />
                        )}
                        Recruiter Portal
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        {/* User Account Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 p-1 pl-3 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] transition-all hover:border-blue-500/30">
                                <div className="flex flex-col items-end mr-1">
                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 leading-none">
                                        {user?.name?.split(' ')[0] || "Recruiter"}
                                    </span>
                                    <span className="text-[9px] text-emerald-500 font-medium mt-0.5 uppercase tracking-tighter">
                                        PRO
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                                    <span className="text-[10px] font-black text-white">
                                        {(user?.name || "R").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full pt-2 w-48 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-[100]">
                                <div className="py-2 bg-white dark:bg-[#0F1424] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/[0.04] mb-1">
                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link
                                        href="/recruiter/profile"
                                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Building className="w-3.5 h-3.5" />
                                        Company Profile
                                    </Link>
                                    <Link
                                        href="/recruiter/settings"
                                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        Organization Settings
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
                            <ThemeToggle />
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-md overflow-hidden p-1">
                                {orgProfile?.logoUrl ? (
                                    <img src={orgProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Briefcase className="w-4 h-4 text-blue-500" />
                                )}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">Portal</span>
                        </div>


                        <button className="p-2 -mr-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-[#0A0A0A]" />
                        </button>
                    </div>
                </header>

                {/* F19: Add-to-Homescreen Install Banner */}
                {showInstallBanner && (
                    <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-600 text-white text-sm z-30">
                        <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 shrink-0" />
                            <span className="font-medium">Add PlaceNxt to your home screen for quick access</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={handleInstall} className="px-3 py-1 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">Add</button>
                            <button onClick={dismissInstallBanner} className="px-2 py-1 text-blue-200 hover:text-white text-xs transition-colors">Dismiss</button>
                        </div>
                    </div>
                )}

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
