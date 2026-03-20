'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    LayoutDashboard,
    FileText,
    Target,
    Briefcase,
    ClipboardList,
    Video,
    FileQuestion,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    RotateCw,
    AlertTriangle,
    User,
    Send,
    MessageSquare,
    FlaskConical,
    QrCode,
    GitBranch,
    GraduationCap,
} from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import ThemeToggle from '@/components/theme/ThemeToggle';
import Logo from '@/components/layout/Logo';

interface NavItem {
    href: string;
    icon: any;
    label: string;
    iconColor: string;
    badge?: string;
    institutionOnly?: boolean;
}

// Career workflow — shown under "Your Career Journey"
const journeyItems: NavItem[] = [
    { href: '/dashboard/resumes', icon: FileText, label: 'Resumes', iconColor: 'text-blue-400' },
    { href: '/dashboard/skills', icon: Target, label: 'Skills', iconColor: 'text-cyan-400' },
    { href: '/dashboard/tests', icon: FileQuestion, label: 'Skill Tests', iconColor: 'text-amber-400' },
    { href: '/dashboard/practice-interview', icon: MessageSquare, label: 'AI Practice', iconColor: 'text-emerald-400', badge: 'Free' },
    { href: '/dashboard/interviews', icon: Video, label: 'Mock Interviews', iconColor: 'text-rose-400' },
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs', iconColor: 'text-emerald-400' },
    { href: '/dashboard/applications', icon: ClipboardList, label: 'Applications', iconColor: 'text-violet-400' },
    { href: '/dashboard/assessments', icon: GitBranch, label: 'Pipeline & Stages', iconColor: 'text-orange-400' },
];

// General / standalone features (most moved to header dropdown)
const otherItems: NavItem[] = [
    { href: '/dashboard/future-lab', icon: FlaskConical, label: 'Future-Ready Lab', iconColor: 'text-violet-400', badge: 'New' },
    { href: '/dashboard/qr-pass', icon: QrCode, label: 'My QR Pass', iconColor: 'text-emerald-500', institutionOnly: true },
    { href: '/dashboard/drives', icon: GraduationCap, label: 'Campus Drives', iconColor: 'text-blue-400', institutionOnly: true },
];



const dashboardItem: NavItem = { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', iconColor: 'text-blue-400' };
const allNavItems = [dashboardItem, ...journeyItems, ...otherItems];

// Helper function to get proper page title from pathname
const getPageTitle = (pathname: string | null): string => {
    if (!pathname) return 'Dashboard';

    // Sort by href length (longest first) to match more specific paths first
    const sortedNavItems = [...allNavItems].sort((a, b) => b.href.length - a.href.length);

    // Check if it matches any nav item
    const matchedItem = sortedNavItems.find(item => {
        if (item.href === pathname) return true;
        if (pathname.startsWith(`${item.href}/`)) return true;
        return false;
    });

    if (matchedItem) return matchedItem.label;

    // Fallback to formatted pathname
    const segment = pathname.split('/').pop() || 'Dashboard';
    return segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default function DashboardLayout({
    children }: {
        children: React.ReactNode;
    }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, fetchUser, _hasHydrated } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);

    const handleResendVerification = async () => {
        if (!user?.email) return;
        setIsResending(true);
        try {
            const res = await authFetch('/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            });
            const data = await res.json();

            if (res.ok) {
                toast({
                    title: "Verification Email Sent",
                    description: "Please check your inbox and verify your email.",
                });
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Failed to send verification email.",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = useCallback(() => {
        logout();
        router.push('/');
    }, [logout, router]);

    // Idle Timeout Logic (10 minutes)
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (!user) return;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handleLogout();
            }, 10 * 60 * 1000); // 10 minutes
        };

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // Add listeners
        if (user) {
            resetTimer(); // Start timer initially
            events.forEach(event => window.addEventListener(event, resetTimer));
        }

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [user, handleLogout]);

    useEffect(() => {
        // Wait for hydration before checking auth
        if (!_hasHydrated) return;

        if (!user) {
            router.push('/login');
        }
    }, [user, router, _hasHydrated]);

    // Daily-login engagement ping — fires once per browser session
    useEffect(() => {
        if (!user || !_hasHydrated) return;
        if (sessionStorage.getItem('pn_daily_login_pinged')) return;
        sessionStorage.setItem('pn_daily_login_pinged', '1');
        authFetch('/billing/engagement/daily-login', { method: 'POST' }).catch(() => { /* non-critical */ });
    }, [user, _hasHydrated]);

    if (!_hasHydrated || !user) {
        // Show nothing or a loading spinner while hydrating or redirecting
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Detect if user is in an interview room or meeting (should hide sidebar)
    const isInterviewRoom = (pathname?.includes('/interviews/') &&
        (pathname?.includes('/room') || pathname?.includes('/hr-room') || pathname?.includes('/mixed-room'))) ||
        pathname?.includes('/meetings/');

    return (
        <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-gray-950">
            {/* Hide sidebar entirely when in interview room */}
            {!isInterviewRoom && (
                <>
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
                        w-64 border-r border-gray-200/80 dark:border-white/5
                        bg-white dark:bg-gray-950
                        shadow-[1px_0_0_0_rgba(0,0,0,0.04)] dark:shadow-none
                        transform transition-transform duration-200 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                      `}>
                        <div className="flex flex-col h-full">
                            {/* Logo */}
                            <div className="px-5 py-5 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                                <Link href="/dashboard" className="flex items-center gap-3 group">
                                    <Logo width={140} height={46} />
                                </Link>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="lg:hidden text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-3 py-4 overflow-y-auto">

                                {/* Dashboard */}
                                <div className="mb-3">
                                    {(() => {
                                        const isActive = pathname === '/dashboard';
                                        return (
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-500/15 dark:to-sky-500/10 text-blue-700 dark:text-white shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}
                                                `}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-blue-600 to-teal-500" />
                                                )}
                                                <LayoutDashboard className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-blue-400'}`} style={{ width: '18px', height: '18px' }} />
                                                <span className={`font-semibold text-[15px] ${isActive ? 'text-blue-700 dark:text-white' : ''}`}>Dashboard</span>
                                            </Link>
                                        );
                                    })()}
                                </div>

                                {/* Your Career Journey */}
                                <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                    Your Career Journey
                                </p>
                                <div className="space-y-1 mb-3">
                                    {journeyItems.map((item) => {
                                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-500/15 dark:to-sky-500/10 text-blue-700 dark:text-white shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}
                                                `}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-blue-600 to-teal-500" />
                                                )}
                                                <item.icon className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : item.iconColor}`} style={{ width: '18px', height: '18px' }} />
                                                <span className={`font-semibold text-[15px] ${isActive ? 'text-blue-700 dark:text-white' : ''}`}>{item.label}</span>
                                                {item.badge && (
                                                    <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Divider */}
                                <div className="mx-2 mb-3 h-px bg-gray-100 dark:bg-white/5" />

                                {/* Other */}
                                <div className="space-y-1">
                                    {otherItems
                                        .filter(item => !item.institutionOnly || (user?.institutionId && user.institutionId !== "null"))
                                        .map((item) => {
                                            const isActive = item.href === '/dashboard'

                                            ? pathname === item.href
                                            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`
                                                    relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-500/15 dark:to-sky-500/10 text-blue-700 dark:text-white shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}
                                                `}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-blue-600 to-teal-500" />
                                                )}
                                                <item.icon className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : item.iconColor}`} style={{ width: '18px', height: '18px' }} />
                                                <span className={`font-semibold text-[15px] ${isActive ? 'text-blue-700 dark:text-white' : ''}`}>{item.label}</span>
                                                {item.badge && (
                                                    <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </nav>

                            {/* User Profile Dropdown Trigger */}
                            {/* User Profile moved to Header */}
                        </div>
                    </aside>
                </>
            )}

            {/* Main content - always visible */}
            <main className={`flex-1 flex flex-col min-w-0 ${isInterviewRoom ? 'w-full' : 'lg:ml-0'}`}>
                {/* Hide headers in interview room */}
                {!isInterviewRoom && (
                    <>
                        {/* Desktop Header */}
                        <header className="hidden lg:flex items-center justify-between px-8 py-4 glass border-b border-gray-200 dark:border-white/5 sticky top-0 z-40">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                {getPageTitle(pathname)}
                            </h1>
                            <div className="flex items-center gap-4">
                                {/* Messages Link */}
                                <Link
                                    href="/dashboard/messages"
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border ${pathname?.startsWith('/dashboard/messages')
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                        }`}
                                    title="Messages"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </Link>

                                <ThemeToggle />

                                {/* User Dropdown */}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 p-1 pl-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all hover:border-blue-500/30">
                                        <div className="flex flex-col items-end mr-1">
                                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 leading-none">
                                                {user?.name?.split(' ')[0] || "User"}
                                            </span>
                                            <span className="text-[9px] text-gray-500 dark:text-gray-500 font-medium mt-0.5">
                                                Candidate
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
                                            <span className="text-white text-[10px] font-black">
                                                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Dropdown Menu - Added padding-top to bridge the gap and prevent instant closing */}
                                    <div className="absolute right-0 top-full pt-2 w-48 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-[100]">
                                        <div className="py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                                            <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <User className="w-4 h-4" />
                                                Profile
                                            </Link>
                                            <Link href="/dashboard/billing" className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <CreditCard className="w-3.5 h-3.5" />
                                                Billing & Credits
                                            </Link>
                                            <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <Settings className="w-3.5 h-3.5" />
                                                Settings
                                            </Link>
                                            <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left">
                                                <LogOut className="w-3.5 h-3.5" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                    <Logo width={100} height={33} />
                                </div>
                                <ThemeToggle />
                            </div>
                        </header>
                    </>
                )}



                {/* Verification Warning */}
                {!isInterviewRoom && user && !user.isVerified && (
                    <div className="bg-yellow-50 dark:bg-yellow-500/10 border-b border-yellow-200 dark:border-yellow-500/20 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                Please verify your email address ({user.email}) to unlock free credits and all features.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className="flex items-center gap-2 text-xs font-medium text-yellow-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {isResending ? 'Sending...' : 'Resend Email'}
                            </button>
                            <button
                                onClick={() => fetchUser()}
                                className="flex items-center gap-2 text-xs font-medium text-yellow-500 hover:text-yellow-400 transition-colors"
                            >
                                <RotateCw className="w-4 h-4" />
                                Check Status
                            </button>
                        </div>
                    </div>
                )}

                <div className={`flex-1 ${isInterviewRoom ? 'p-0' : 'p-6 lg:p-8'} overflow-y-auto overflow-x-hidden max-w-full`}>
                    {children}
                </div>
            </main>
        </div >
    );
}




