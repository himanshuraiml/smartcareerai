'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
    User
} from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import ThemeToggle from '@/components/theme/ThemeToggle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Nav items with unlock requirements
interface NavItem {
    href: string;
    icon: any;
    label: string;
    unlockStage: number; // 0 = always visible, 1+ = unlocks at that stage
}

const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', unlockStage: 0 },
    { href: '/dashboard/resumes', icon: FileText, label: 'Resumes', unlockStage: 0 },
    { href: '/dashboard/skills', icon: Target, label: 'Skills', unlockStage: 2 }, // Unlocks with resume
    { href: '/dashboard/tests', icon: FileQuestion, label: 'Skill Tests', unlockStage: 2 }, // Unlocks with resume
    { href: '/dashboard/interviews', icon: Video, label: 'Interviews', unlockStage: 3 }, // Unlocks after skills/tests
    { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs', unlockStage: 3 }, // Unlocks with interviews
    { href: '/dashboard/applications', icon: ClipboardList, label: 'Applications', unlockStage: 3 }, // Unlocks with interviews
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing & Credits', unlockStage: 0 },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, accessToken, _hasHydrated } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userStage, setUserStage] = useState(0); // 0=new, 1=has resume, 2=has ats score, 3=applied to jobs
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Idle Timeout Logic (10 minutes)
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (!accessToken) return;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log('💤 User inactive for 10 mins, logging out...');
                handleLogout(); // Use existing handleLogout
            }, 10 * 60 * 1000); // 10 minutes
        };

        // Events to listen for
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // Add listeners
        if (accessToken) {
            resetTimer(); // Start timer initially
            events.forEach(event => window.addEventListener(event, resetTimer));
        }

        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [accessToken]); // Re-bind if login status changes

    // Fetch user progress to determine sidebar visibility
    const fetchUserProgress = useCallback(async () => {
        if (!accessToken) return;

        try {
            const headers = { 'Authorization': `Bearer ${accessToken}` };

            // Fetch each endpoint individually to avoid one failure blocking all
            const resumeData = await fetch(`${API_URL}/resumes`, { headers })
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const skillsData = await fetch(`${API_URL}/skills/user-skills`, { headers })
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const testsData = await fetch(`${API_URL}/validation/attempts`, { headers })
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const interviewData = await fetch(`${API_URL}/interviews/sessions`, { headers })
                .then(res => res.ok ? res.json() : { data: [] })
                .catch(() => ({ data: [] }));

            const appData = await fetch(`${API_URL}/applications/stats`, { headers })
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

            console.log('User progress:', { hasResume, hasSkillsAnalyzed, hasTests, hasInterviews, hasApplied, stage });
            setUserStage(stage);
        } catch (err) {
            console.error('Failed to fetch user progress:', err);
            // Default to stage 1 so users aren't fully blocked
            setUserStage(1);
        }
    }, [accessToken]);

    useEffect(() => {
        // Wait for hydration before checking auth
        if (!_hasHydrated) return;

        if (!accessToken) {
            router.push('/login');
        } else {
            fetchUserProgress();
        }
    }, [accessToken, router, fetchUserProgress, _hasHydrated]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!_hasHydrated || !accessToken) {
        // Show nothing or a loading spinner while hydrating or redirecting
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
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

    return (
        <div className="min-h-screen flex bg-gray-950">
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
    w-64 glass border-r border-white/5
    transform transition-transform duration-200 ease-in-out
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="SmartCareerAI Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-lg"
                            />
                            <span className="text-lg font-bold gradient-text">SmartCareerAI</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* New User Welcome */}
                    {isNewUser && (
                        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-bold text-white">Welcome!</span>
                            </div>
                            <p className="text-xs text-gray-300">
                                Follow your career roadmap to unlock more features.
                            </p>
                        </div>
                    )}

                    {/* Navigation - Unlocked Items */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        {unlockedItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Locked Items Section */}
                        {lockedItems.length > 0 && (
                            <>
                                <div className="py-3">
                                    <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        Unlock by progressing
                                    </p>
                                </div>
                                {lockedItems.map((item) => (
                                    <div
                                        key={item.href}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 cursor-not-allowed opacity-50"
                                    >
                                        <Lock className="w-4 h-4" />
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </nav>

                    {/* User Profile Dropdown Trigger (Replaced Bottom Bar) */}
                    <div className="p-4 border-t border-white/5 relative">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-medium">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {userMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-4 right-4 mb-2 p-2 rounded-xl bg-gray-900 border border-white/10 shadow-xl backdrop-blur-xl z-50"
                                >
                                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                        <User className="w-4 h-4" />
                                        <span className="text-sm">Profile</span>
                                    </Link>
                                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                        <Settings className="w-4 h-4" />
                                        <span className="text-sm">Settings</span>
                                    </Link>
                                    <div className="h-px bg-white/10 my-1" />
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

            {/* Main content */}
            <main className="flex-1 lg:ml-0 flex flex-col min-w-0">
                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-between px-8 py-4 glass border-b border-white/5 sticky top-0 z-40">
                    <h1 className="text-xl font-bold text-white capitalize">
                        {pathname?.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header>

                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 glass border-b border-white/5">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="font-bold gradient-text">SmartCareerAI</span>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
