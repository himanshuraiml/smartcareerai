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
    Lock,
    Sparkles,
    RotateCw,
    AlertTriangle,
    User,
    Send,
    MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import ThemeToggle from '@/components/theme/ThemeToggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Nav items with unlock requirements
interface NavItem {
    href: string;
    icon: any;
    label: string;
    unlockStage: number; // 0 = always visible, 1+ = unlocks at that stage
    iconColor: string; // Tailwind text color for the icon
    badge?: string; // Optional badge text
}

const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', unlockStage: 0, iconColor: 'text-indigo-400' },
    { href: '/dashboard/resumes', icon: FileText, label: 'Resumes', unlockStage: 0, iconColor: 'text-blue-400' },
    { href: '/dashboard/skills', icon: Target, label: 'Skills', unlockStage: 2, iconColor: 'text-cyan-400' },
    { href: '/dashboard/tests', icon: FileQuestion, label: 'Skill Tests', unlockStage: 2, iconColor: 'text-amber-400' },
    { href: '/dashboard/practice-interview', icon: MessageSquare, label: 'Practice Interview', unlockStage: 0, iconColor: 'text-emerald-400', badge: 'Free' },
    { href: '/dashboard/interviews', icon: Video, label: 'Mock Interviews', unlockStage: 3, iconColor: 'text-rose-400' },
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs', unlockStage: 3, iconColor: 'text-emerald-400' },
    { href: '/dashboard/applications', icon: ClipboardList, label: 'Applications', unlockStage: 3, iconColor: 'text-violet-400' },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing & Credits', unlockStage: 0, iconColor: 'text-orange-400' },
];

// Helper function to get proper page title from pathname
const getPageTitle = (pathname: string | null): string => {
    if (!pathname) return 'Dashboard';

    // Sort navItems by href length (longest first) to match more specific paths first
    const sortedNavItems = [...navItems].sort((a, b) => b.href.length - a.href.length);

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
    const [userStage, setUserStage] = useState(0); // 0=new, 1=has resume, 2=has ats score, 3=applied to jobs
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

    // Fetch user progress to determine sidebar visibility
    const fetchUserProgress = useCallback(async () => {
        if (!user) return;

        try {

            // Fetch each endpoint individually to avoid one failure blocking all
            const resumeData = await authFetch('/resumes')
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const skillsData = await authFetch('/skills/user-skills')
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const testsData = await authFetch('/validation/attempts')
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const interviewData = await authFetch('/interviews/sessions')
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const appData = await authFetch('/applications/stats')
                .then(res => res.ok ? res.json() : { data: { applied: 0 } })
                .catch(() => ({ data: { applied: 0 } }));

            const hasResume = (resumeData.data?.length || 0) > 0;
            const hasSkillsAnalyzed = (skillsData.data?.length || 0) > 0;
            const hasTests = (testsData.data?.length || 0) > 0;
            const hasInterviews = (interviewData.data?.length || 0) > 0;
            const hasApplied = (appData.data?.applied || 0) > 0;

            // Calculate stage - be more lenient
            // If user has resume, unlock skills (stage 1)
            // If user has resume, also unlock skill tests (stage 2) - people often do these together
            let stage = 0;
            if (hasResume) stage = 2; // Unlock both Skills and Skill Tests with resume
            if (hasSkillsAnalyzed || hasTests) stage = Math.max(stage, 3); // Unlock Interviews
            if (hasInterviews) stage = 4; // Unlock Jobs/Applications
            if (hasApplied) stage = 5;

            setUserStage(stage);
        } catch (err) {
            // Failed to fetch user progress - default to stage 1 so users aren't fully blocked
            setUserStage(1);
        }
    }, [user]);

    useEffect(() => {
        // Wait for hydration before checking auth
        if (!_hasHydrated) return;

        if (!user) {
            router.push('/login');
        }
    }, [user, router, _hasHydrated]);

    useEffect(() => {
        if (_hasHydrated && user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetching
            fetchUserProgress();
        }
    }, [_hasHydrated, user, fetchUserProgress]);



    if (!_hasHydrated || !user) {
        // Show nothing or a loading spinner while hydrating or redirecting
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Calculate which items are unlocked
    const getUnlockedItems = () => {
        return navItems.filter(item => item.unlockStage <= userStage);
    };

    const getLockedItems = () => {
        return navItems.filter(item => item.unlockStage > userStage);
    };

    const unlockedItems = getUnlockedItems();
    const lockedItems = getLockedItems();
    const isNewUser = userStage === 0;

    // Detect if user is in an interview room (should hide sidebar)
    const isInterviewRoom = pathname?.includes('/interviews/') &&
        (pathname?.includes('/room') || pathname?.includes('/hr-room') || pathname?.includes('/mixed-room'));

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
                                </Link>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="lg:hidden text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* New User Welcome */}
                            {isNewUser && (
                                <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/20 dark:to-violet-500/20 border border-indigo-200 dark:border-indigo-500/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                        <span className="text-sm font-bold text-indigo-700 dark:text-white">Welcome!</span>
                                    </div>
                                    <p className="text-xs text-indigo-600/70 dark:text-gray-300">
                                        Follow your career roadmap to unlock more features.
                                    </p>
                                </div>
                            )}

                            {/* Navigation - Unlocked Items */}
                            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

                                {unlockedItems.map((item) => {
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
                                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/15 dark:to-purple-500/15 text-indigo-700 dark:text-white shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'}
                                              `}
                                        >
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                                            )}
                                            <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : item.iconColor}`} style={{ width: '18px', height: '18px' }} />
                                            <span className={`font-semibold text-[15px] ${isActive ? 'text-indigo-700 dark:text-white' : ''}`}>{item.label}</span>
                                            {item.badge && (
                                                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wider">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}

                                {/* Locked Items Section */}
                                {lockedItems.length > 0 && (
                                    <>
                                        <div className="pt-4 pb-1">
                                            <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                Unlock by progressing
                                            </p>
                                        </div>
                                        {lockedItems.map((item) => (
                                            <div
                                                key={item.href}
                                                title="Complete earlier stages to unlock"
                                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 dark:text-gray-600 cursor-not-allowed select-none"
                                            >
                                                <Lock className="w-4 h-4 flex-shrink-0" />
                                                <span className="font-semibold text-[15px]">{item.label}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </nav>

                            {/* User Profile Dropdown Trigger */}
                            <div className="p-3 border-t border-gray-100 dark:border-white/5 relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all duration-200 border border-gray-100 dark:border-white/5 text-left group"
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-70" />
                                        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">
                                                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                    <Settings className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full left-4 right-4 mb-2 p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl backdrop-blur-xl z-50"
                                        >
                                            <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <User className="w-4 h-4" />
                                                <span className="text-sm">Profile</span>
                                            </Link>
                                            <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <Settings className="w-4 h-4" />
                                                <span className="text-sm">Settings</span>
                                            </Link>
                                            <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="text-sm">Logout</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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
                                <ThemeToggle />
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
                                    <Image
                                        src="/logo-new-light.png"
                                        alt="PlaceNxt Logo"
                                        width={160}
                                        height={40}
                                        className="h-10 w-auto block dark:hidden"
                                        priority
                                    />
                                    <Image
                                        src="/logo-new-dark.png"
                                        alt="PlaceNxt Logo"
                                        width={160}
                                        height={40}
                                        className="h-10 w-auto hidden dark:block"
                                        priority
                                    />
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
        </div>
    );
}




