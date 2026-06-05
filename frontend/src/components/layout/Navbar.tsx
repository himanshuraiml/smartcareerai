'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from '@/components/layout/Logo';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowUpRight } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store/auth.store';

const SOLUTIONS_MEGA_MENU = {
    platform: {
        title: 'Platform',
        items: [
            { label: 'AI Resume Scorer', href: '/solutions/platform/resume-scorer', desc: 'Score and optimize resumes against job descriptions.' },
            { label: 'Assessment Engine', href: '/solutions/platform/assessment-engine', desc: 'Take validated technical tests and prove competency.' },
            { label: 'Credentials & Badges', href: '/solutions/platform/credentials', desc: 'Showcase verified skill badges on your public profile.' },
        ]
    },
    aiFeatures: {
        title: 'AI Features',
        items: [
            { label: 'AI Mock Interviews', href: '/solutions/ai/mock-interviews', desc: 'Conduct interactive practice sessions with real-time feedback.' },
            { label: 'ATS Score Predictor', href: '/solutions/ai/ats-predictor', desc: 'Analyze CV compatibility with specific JDs instantly.' },
            { label: 'AI Career Copilot', href: '/solutions/ai/career-copilot', desc: 'Get matching jobs and courses tailored to your skills.' },
        ]
    },
    moreSolutions: {
        title: 'More Solutions',
        items: [
            { label: 'Recruiter Pipelines', href: '/solutions/recruiter', desc: 'Source pre-vetted candidates with visual pipelines.' },
            { label: 'Institutional Portals', href: '/solutions/university', desc: 'Track batch performance and placement analytics.' },
            { label: 'DEI & Bias-Free Sourcing', href: '/solutions/recruiter#dei', desc: 'Hire based purely on verified assessment scores.' },
            { label: 'Enterprise Plans', href: '/pricing#enterprise', desc: 'Custom batches and dedicated support.' },
        ]
    }
};

const COMPARE_MEGA_MENU = {
    placenxtVs: {
        title: 'Compare PlaceNxt',
        items: [
            { label: 'PlaceNxt vs Unstop', href: '/compare/unstop', desc: 'AI career infrastructure vs event-centric campus hiring.' },
            { label: 'PlaceNxt vs HackerRank', href: '/compare/hackerrank', desc: 'Full-stack career AI vs coding-only assessment portals.' },
            { label: 'PlaceNxt vs HackerEarth', href: '/compare/hackerearth', desc: 'Placement intelligence vs hackathon-first hiring platforms.' },
        ]
    },
    placenxtVsMore: {
        title: 'Compare Mock & CRM',
        items: [
            { label: 'PlaceNxt vs Internshala', href: '/compare/internshala', desc: 'Verified talent pipelines vs unfiltered internship listings.' },
            { label: 'PlaceNxt vs iMocha', href: '/compare/imocha', desc: 'Integrated career AI vs standalone skill assessment engine.' },
            { label: 'PlaceNxt vs Talview', href: '/compare/talview', desc: 'All-in-one career AI vs standalone AI video interviewing.' },
        ]
    },
    bestGuides: {
        title: 'Best Guides',
        items: [
            { label: 'Best Placement Tools for Students', href: '/compare/guides/student-tools', desc: 'AI resources to maximize campus placement success in 2026.' },
            { label: 'Best Platforms for Campus Hiring', href: '/compare/guides/campus-hiring', desc: 'Compare modern campus hiring platforms for 2026.' },
        ]
    }
};

const RESOURCES_MEGA_MENU = {
    learn: {
        title: 'Learn',
        items: [
            { label: 'Blog', href: '/blog', desc: 'Insights and best practices for technical rounds.' },
            { label: 'Guides & eBooks', href: '/resources/guides', desc: 'In-depth early-career preparation manuals.' },
            { label: 'Events & Webinars', href: '/resources/events', desc: 'Upcoming panel discussions and placement webinars.' },
        ]
    },
    support: {
        title: 'Support',
        items: [
            { label: 'Help Center', href: '/help', desc: 'Find quick answers and user guides.' },
            { label: 'Submit a Ticket', href: '/support/ticket', desc: 'Get direct help from our tech support team.' },
            { label: 'Partnerships', href: '/company/partners', desc: 'Join our institutional placement network.' },
            { label: 'API & Integrations', href: '/docs/api', desc: 'Connect PlaceNxt with college databases.' },
        ]
    }
};

const COMPANY_MEGA_MENU = {
    about: {
        title: 'About',
        items: [
            { label: 'Why PlaceNxt', href: '/about/why-placenxt', desc: 'Discover what makes our AI verification unique.' },
            { label: 'Success Stories', href: '/success-stories', desc: 'See how candidates and universities land jobs.' },
            { label: 'Pricing Plans', href: '/pricing', desc: 'Transparent subscription tiers for all users.' },
        ]
    },
    contact: {
        title: 'Contact',
        items: [
            { label: 'Request a Demo', href: '/contact?type=demo', desc: 'See the university dashboard in action.' },
            { label: 'Contact Support', href: '/contact?type=support', desc: 'Talk to our customer success team.' },
            { label: 'Press & Media', href: '/company/press', desc: 'Official brand assets and media resources.' },
        ]
    }
};

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const userRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const router = useRouter();
    const { user, _hasHydrated, logout } = useAuthStore();
    const isLoggedIn = _hasHydrated && !!user;

    // Mobile collapsible sections
    const [mobileSections, setMobileSections] = useState<Record<string, boolean>>({
        solutions: false,
        compare: false,
        resources: false,
        company: false,
    });

    const toggleMobileSection = (section: string) => {
        setMobileSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (userRef.current && !userRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const brandBlue = '#1B5FD8'; // Deep electric blue for text contrast in light mode
    const darkAccent = '#2B7FFF'; // Electric blue for dark mode
    const activeColor = isLight ? brandBlue : darkAccent;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
            isLight
                ? scrolled
                    ? 'bg-[#F7F9FC]/90 backdrop-blur-md border-slate-200/80 shadow-sm'
                    : 'bg-white border-transparent'
                : scrolled
                    ? 'bg-[#050B18]/90 backdrop-blur-md border-[rgba(43,127,255,0.15)] shadow-lg'
                    : 'bg-transparent border-transparent'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-center justify-between h-16">
                    
                    {/* Left: Logo & Sign In / Dashboard */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center flex-shrink-0">
                            <Logo width={160} height={53} />
                        </Link>

                        {/* Sign In / Dashboard Pill next to Logo */}
                        <div className="hidden md:block">
                            {isLoggedIn ? (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        borderColor: isLight ? 'rgba(27, 95, 216, 0.3)' : 'rgba(43, 127, 255, 0.3)',
                                        color: activeColor,
                                        backgroundColor: isLight ? 'rgba(27, 95, 216, 0.02)' : 'rgba(43, 127, 255, 0.02)',
                                    }}
                                >
                                    Dashboard <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                        borderColor: isLight ? 'rgba(27, 95, 216, 0.3)' : 'rgba(43, 127, 255, 0.3)',
                                        color: activeColor,
                                        backgroundColor: isLight ? 'rgba(27, 95, 216, 0.02)' : 'rgba(43, 127, 255, 0.02)',
                                    }}
                                >
                                    Sign In <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Center: Dropdown links (Desktop) */}
                    <div className="hidden md:flex items-center gap-6">
                        {/* Solutions Dropdown Trigger */}
                        <div
                            className="py-2"
                            onMouseEnter={() => setActiveDropdown('solutions')}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            <button
                                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 capitalize ${
                                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                }`}
                            >
                                Solutions
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    activeDropdown === 'solutions' ? 'rotate-180' : ''
                                }`} style={{ color: activeDropdown === 'solutions' ? activeColor : undefined }} />
                            </button>
                        </div>

                        {/* Compare Dropdown Trigger */}
                        <div
                            className="py-2"
                            onMouseEnter={() => setActiveDropdown('compare')}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            <button
                                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 capitalize ${
                                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                }`}
                            >
                                Compare
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    activeDropdown === 'compare' ? 'rotate-180' : ''
                                }`} style={{ color: activeDropdown === 'compare' ? activeColor : undefined }} />
                            </button>
                        </div>

                        {/* Resources Dropdown Trigger */}
                        <div
                            className="py-2"
                            onMouseEnter={() => setActiveDropdown('resources')}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            <button
                                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 capitalize ${
                                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                }`}
                            >
                                Resources
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    activeDropdown === 'resources' ? 'rotate-180' : ''
                                }`} style={{ color: activeDropdown === 'resources' ? activeColor : undefined }} />
                            </button>
                        </div>

                        {/* Company Dropdown Trigger */}
                        <div
                            className="py-2"
                            onMouseEnter={() => setActiveDropdown('company')}
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            <button
                                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 capitalize ${
                                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                }`}
                            >
                                Company
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    activeDropdown === 'company' ? 'rotate-180' : ''
                                }`} style={{ color: activeDropdown === 'company' ? activeColor : undefined }} />
                            </button>
                        </div>
                    </div>

                    {/* Right: Request Demo & Pricing (Desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/contact"
                            className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] text-white"
                            style={{
                                backgroundColor: activeColor,
                            }}
                        >
                            Request Demo
                        </Link>
                        
                        <Link
                            href="/pricing"
                            className="px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                borderColor: activeColor,
                                color: activeColor,
                                backgroundColor: 'transparent',
                            }}
                        >
                            Pricing
                        </Link>

                        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1" />

                        {isLoggedIn ? (
                            <div className="relative" ref={userRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150 ${
                                        isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                        style={{ backgroundColor: activeColor }}
                                    >
                                        {(user.name ?? user.email)[0].toUpperCase()}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full pt-2 w-44 z-50"
                                        >
                                            <div className={`rounded-xl border shadow-xl overflow-hidden ${
                                                isLight ? 'bg-white border-slate-200' : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)]'
                                            }`}>
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                                        isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-200 hover:bg-white/[0.04]'
                                                    }`}
                                                >
                                                    Dashboard
                                                </Link>
                                                <button
                                                    onClick={() => { logout(); router.push('/'); setUserMenuOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 transition-colors ${
                                                        isLight ? 'hover:bg-red-50' : 'hover:bg-red-500/[0.08]'
                                                    }`}
                                                >
                                                    Sign out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : null}

                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`p-2 rounded-lg transition-colors ${
                                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/[0.08]'
                            }`}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>

                </div>

                {/* Solutions Mega Menu Dropdown */}
                <div
                    onMouseEnter={() => setActiveDropdown('solutions')}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <AnimatePresence>
                        {activeDropdown === 'solutions' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute top-full left-4 right-4 md:left-0 md:right-0 pt-2 z-50"
                            >
                                <div className={`rounded-2xl border shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 ${
                                    isLight
                                        ? 'bg-white border-slate-200 shadow-slate-200/50'
                                        : 'bg-[#091324] border-[rgba(43,127,255,0.18)] shadow-black/40'
                                }`}>
                                    {/* Mega Menu Content (Left & Center columns) */}
                                    <div className="md:col-span-9 p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                                        {/* Platform Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {SOLUTIONS_MEGA_MENU.platform.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {SOLUTIONS_MEGA_MENU.platform.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* AI Features Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {SOLUTIONS_MEGA_MENU.aiFeatures.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {SOLUTIONS_MEGA_MENU.aiFeatures.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* More Solutions Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {SOLUTIONS_MEGA_MENU.moreSolutions.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {SOLUTIONS_MEGA_MENU.moreSolutions.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banner Section (Right side) */}
                                    <div className={`md:col-span-3 p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l ${
                                        isLight
                                            ? 'bg-blue-50/50 border-slate-200/50'
                                            : 'bg-[#0E1E38]/50 border-white/[0.06]'
                                    }`}>
                                        <div>
                                            <h4 className={`text-sm font-bold tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                See PlaceNxt in Action
                                            </h4>
                                            <p className={`text-xs leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                                Schedule a personalized demo and discover how PlaceNxt transforms early career hiring and prep.
                                            </p>
                                        </div>
                                        <Link
                                            href="/contact"
                                            onClick={() => setActiveDropdown(null)}
                                            className="inline-flex items-center gap-1 text-xs font-bold transition-all duration-150 hover:gap-2"
                                            style={{ color: activeColor }}
                                        >
                                            Request a Demo <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Compare Mega Menu Dropdown */}
                <div
                    onMouseEnter={() => setActiveDropdown('compare')}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <AnimatePresence>
                        {activeDropdown === 'compare' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute top-full left-4 right-4 md:left-0 md:right-0 pt-2 z-50"
                            >
                                <div className={`rounded-2xl border shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 ${
                                    isLight
                                        ? 'bg-white border-slate-200 shadow-slate-200/50'
                                        : 'bg-[#091324] border-[rgba(43,127,255,0.18)] shadow-black/40'
                                }`}>
                                    {/* Mega Menu Content (Left & Center columns) */}
                                    <div className="md:col-span-9 p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                                        {/* PlaceNxt Vs. Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {COMPARE_MEGA_MENU.placenxtVs.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {COMPARE_MEGA_MENU.placenxtVs.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Compare Mock & CRM Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {COMPARE_MEGA_MENU.placenxtVsMore.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {COMPARE_MEGA_MENU.placenxtVsMore.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Best Guides Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {COMPARE_MEGA_MENU.bestGuides.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {COMPARE_MEGA_MENU.bestGuides.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compare Banner Section (Right side) */}
                                    <div className={`md:col-span-3 p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l ${
                                        isLight
                                            ? 'bg-blue-50/50 border-slate-200/50'
                                            : 'bg-[#0E1E38]/50 border-white/[0.06]'
                                    }`}>
                                        <div>
                                            <h4 className={`text-sm font-bold tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                                Why Colleges Switch
                                            </h4>
                                            <p className={`text-xs leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                                See how PlaceNxt replaces legacy portals with integrated AI, verified skill badges, and direct recruiter pipelines.
                                            </p>
                                        </div>
                                        <Link
                                            href="/about/why-placenxt"
                                            onClick={() => setActiveDropdown(null)}
                                            className="inline-flex items-center gap-1 text-xs font-bold transition-all duration-150 hover:gap-2"
                                            style={{ color: activeColor }}
                                        >
                                            Explore Why PlaceNxt <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Resources Mega Menu Dropdown */}
                <div
                    onMouseEnter={() => setActiveDropdown('resources')}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <AnimatePresence>
                        {activeDropdown === 'resources' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute top-full left-4 right-4 md:left-0 md:right-0 pt-2 z-50"
                            >
                                <div className={`rounded-2xl border shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 ${
                                    isLight
                                        ? 'bg-white border-slate-200 shadow-slate-200/50'
                                        : 'bg-[#091324] border-[rgba(43,127,255,0.18)] shadow-black/40'
                                }`}>
                                    {/* Mega Menu Content (Left & Center columns) */}
                                    <div className="md:col-span-8 p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        {/* Learn Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {RESOURCES_MEGA_MENU.learn.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {RESOURCES_MEGA_MENU.learn.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Support Column */}
                                        <div>
                                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                                isLight ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                                {RESOURCES_MEGA_MENU.support.title}
                                            </h4>
                                            <div className="space-y-4">
                                                {RESOURCES_MEGA_MENU.support.items.map(item => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setActiveDropdown(null)}
                                                        className="group block"
                                                    >
                                                        <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                            {item.label}
                                                        </p>
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Report Banner Section (Right side) */}
                                    <div className="md:col-span-4 p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#1B5FD8] to-[#050B18] text-white">
                                        <div className="relative z-10">
                                            <div className="mb-4">
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white uppercase tracking-wider">
                                                    Report
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold tracking-tight mb-2 leading-snug">
                                                2026 Early-Career Sourcing Report: Why Verified Skills Matter
                                            </h4>
                                            <p className="text-xs text-white/70 leading-relaxed mb-6">
                                                Discover how AI screening and verified badge certifications reduce time-to-hire by 80%.
                                            </p>
                                        </div>
                                        <Link
                                            href="/resources/reports/2026-early-career"
                                            onClick={() => setActiveDropdown(null)}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-[#5BA3FF] hover:text-white transition-colors relative z-10"
                                        >
                                            Read Now <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                        
                                        {/* Subtle graphic lines */}
                                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
                                            <div className="w-48 h-48 rounded-full border-4 border-white" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Company Mega Menu Dropdown */}
                <div
                    onMouseEnter={() => setActiveDropdown('company')}
                    onMouseLeave={() => setActiveDropdown(null)}
                >
                    <AnimatePresence>
                        {activeDropdown === 'company' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute top-full left-4 right-4 md:left-auto md:right-auto md:w-[680px] md:left-1/2 md:-translate-x-1/2 pt-2 z-50"
                            >
                                <div className={`rounded-2xl border shadow-2xl p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 ${
                                    isLight
                                        ? 'bg-white border-slate-200 shadow-slate-200/50'
                                        : 'bg-[#091324] border-[rgba(43,127,255,0.18)] shadow-black/40'
                                }`}>
                                    {/* About Column */}
                                    <div>
                                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                            isLight ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                            {COMPANY_MEGA_MENU.about.title}
                                        </h4>
                                        <div className="space-y-4">
                                            {COMPANY_MEGA_MENU.about.items.map(item => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setActiveDropdown(null)}
                                                    className="group block"
                                                >
                                                    <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                        {item.label}
                                                    </p>
                                                    <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                        {item.desc}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Contact Column */}
                                    <div>
                                        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${
                                            isLight ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                            {COMPANY_MEGA_MENU.contact.title}
                                        </h4>
                                        <div className="space-y-4">
                                            {COMPANY_MEGA_MENU.contact.items.map(item => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setActiveDropdown(null)}
                                                    className="group block"
                                                >
                                                    <p className="text-sm font-semibold transition-colors duration-150 group-hover:opacity-85" style={{ color: activeColor }}>
                                                        {item.label}
                                                    </p>
                                                    <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>
                                                        {item.desc}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* Mobile Menu Panel */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className={`overflow-hidden border-t md:hidden ${
                            isLight ? 'border-slate-100 bg-[#F7F9FC]' : 'border-white/[0.06] bg-[#050B18]'
                        }`}
                    >
                        <div className="px-4 py-6 space-y-4">
                            {/* Mobile Solutions Collapsible Section */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMobileSection('solutions')}
                                    className="w-full flex items-center justify-between py-2 text-sm font-semibold capitalize text-left"
                                    style={{ color: isLight ? '#1e293b' : '#ffffff' }}
                                >
                                    Solutions
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                        mobileSections.solutions ? 'rotate-180' : ''
                                    }`} style={{ color: mobileSections.solutions ? activeColor : undefined }} />
                                </button>
                                <AnimatePresence>
                                    {mobileSections.solutions && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pl-4 border-l border-slate-200 dark:border-white/10 space-y-4 mt-1"
                                        >
                                            {/* Subsections */}
                                            {Object.entries(SOLUTIONS_MEGA_MENU).map(([subKey, section]) => (
                                                <div key={subKey} className="space-y-1">
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {section.title}
                                                    </p>
                                                    {section.items.map(item => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={`block py-1 text-sm ${
                                                                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile Compare Collapsible Section */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMobileSection('compare')}
                                    className="w-full flex items-center justify-between py-2 text-sm font-semibold capitalize text-left"
                                    style={{ color: isLight ? '#1e293b' : '#ffffff' }}
                                >
                                    Compare
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                        mobileSections.compare ? 'rotate-180' : ''
                                    }`} style={{ color: mobileSections.compare ? activeColor : undefined }} />
                                </button>
                                <AnimatePresence>
                                    {mobileSections.compare && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pl-4 border-l border-slate-200 dark:border-white/10 space-y-4 mt-1"
                                        >
                                            {/* Subsections */}
                                            {Object.entries(COMPARE_MEGA_MENU).map(([subKey, section]) => (
                                                <div key={subKey} className="space-y-1">
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {section.title}
                                                    </p>
                                                    {section.items.map(item => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={`block py-1 text-sm ${
                                                                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile Resources Collapsible Section */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMobileSection('resources')}
                                    className="w-full flex items-center justify-between py-2 text-sm font-semibold capitalize text-left"
                                    style={{ color: isLight ? '#1e293b' : '#ffffff' }}
                                >
                                    Resources
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                        mobileSections.resources ? 'rotate-180' : ''
                                    }`} style={{ color: mobileSections.resources ? activeColor : undefined }} />
                                </button>
                                <AnimatePresence>
                                    {mobileSections.resources && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pl-4 border-l border-slate-200 dark:border-white/10 space-y-4 mt-1"
                                        >
                                            {/* Subsections */}
                                            {Object.entries(RESOURCES_MEGA_MENU).map(([subKey, section]) => (
                                                <div key={subKey} className="space-y-1">
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {section.title}
                                                    </p>
                                                    {section.items.map(item => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={`block py-1 text-sm ${
                                                                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile Company Collapsible Section */}
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMobileSection('company')}
                                    className="w-full flex items-center justify-between py-2 text-sm font-semibold capitalize text-left"
                                    style={{ color: isLight ? '#1e293b' : '#ffffff' }}
                                >
                                    Company
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                        mobileSections.company ? 'rotate-180' : ''
                                    }`} style={{ color: mobileSections.company ? activeColor : undefined }} />
                                </button>
                                <AnimatePresence>
                                    {mobileSections.company && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden pl-4 border-l border-slate-200 dark:border-white/10 space-y-4 mt-1"
                                        >
                                            {/* Subsections */}
                                            {Object.entries(COMPANY_MEGA_MENU).map(([subKey, section]) => (
                                                <div key={subKey} className="space-y-1">
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {section.title}
                                                    </p>
                                                    {section.items.map(item => (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={`block py-1 text-sm ${
                                                                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="h-px bg-slate-200 dark:bg-white/10 my-4" />

                            {/* CTAs */}
                            <div className="flex flex-col gap-3">
                                {isLoggedIn ? (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full py-3 rounded-full text-center text-sm font-semibold border transition-colors"
                                        style={{
                                            borderColor: activeColor,
                                            color: activeColor,
                                        }}
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full py-3 rounded-full text-center text-sm font-semibold border transition-colors"
                                        style={{
                                            borderColor: activeColor,
                                            color: activeColor,
                                        }}
                                    >
                                        Sign In
                                    </Link>
                                )}

                                <Link
                                    href="/contact"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 rounded-full text-center text-sm font-semibold text-white transition-colors"
                                    style={{
                                        backgroundColor: activeColor,
                                    }}
                                >
                                    Request Demo
                                </Link>

                                <Link
                                    href="/pricing"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 rounded-full text-center text-sm font-semibold border transition-colors"
                                    style={{
                                        borderColor: activeColor,
                                        color: activeColor,
                                    }}
                                >
                                    Pricing
                                </Link>

                                {isLoggedIn && (
                                    <button
                                        onClick={() => { logout(); router.push('/'); setMobileMenuOpen(false); }}
                                        className="w-full py-3 rounded-full text-center text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-colors"
                                    >
                                        Sign out
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
