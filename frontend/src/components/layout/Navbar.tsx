'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, ArrowRight } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useTheme } from '@/providers/ThemeProvider';
import { platformSolutions } from '@/constants/solutions';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [solutionsOpen, setSolutionsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
            ? (isLight ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm py-3' : 'bg-[#080C16]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl py-3')
            : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5">
                            <Logo width={140} height={46} />
                        </Link>

                        {/* Desktop Nav - Left */}
                        <div className="hidden md:flex items-center ml-10 gap-8">
                            <div className="relative group"
                                onMouseEnter={() => setSolutionsOpen(true)}
                                onMouseLeave={() => setSolutionsOpen(false)}>
                                <button className={`flex items-center gap-1 text-sm font-medium transition-colors ${isLight
                                    ? 'text-gray-600 hover:text-gray-900 focus:text-gray-900'
                                    : 'text-[#94a3b8] hover:text-white focus:text-white'}`}>
                                    Solutions
                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${solutionsOpen ? 'rotate-90 text-indigo-500' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {solutionsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className={`absolute top-full -left-4 pt-4 w-72 z-50`}
                                        >
                                            <div className={`rounded-2xl border p-2 shadow-2xl ${isLight ? 'bg-white border-gray-100' : 'bg-[#0B0F19] border-white/10 shadow-black/50'}`}>
                                                {platformSolutions.map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/solutions/${item.id}`}
                                                        className={`flex items-start gap-4 p-4 rounded-xl transition-all ${isLight ? 'hover:bg-indigo-50' : 'hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${item.color} text-white`}>
                                                            <item.icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.title}</h4>
                                                            <p className={`text-[11px] mt-0.5 line-clamp-1 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>{item.shortDesc}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                                <div className={`mt-2 p-3 border-t ${isLight ? 'border-gray-50' : 'border-white/5'}`}>
                                                    <Link href="/solutions" className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all`}>
                                                        Explore All Solutions
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {[
                                { label: 'Pricing', href: '/pricing' },
                                { label: 'Success Stories', href: '/#success' },
                            ].map(item => (
                                <Link key={item.href} href={item.href}
                                    className={`text-sm font-medium transition-colors ${isLight
                                        ? 'text-gray-600 hover:text-gray-900'
                                        : 'text-[#94a3b8] hover:text-white'}`}>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Nav - Right */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/blog"
                            className={`text-sm font-medium transition-colors ${isLight
                                ? 'text-gray-600 hover:text-gray-900'
                                : 'text-[#94a3b8] hover:text-white'}`}>
                            Blog
                        </Link>
                        <Link href="/login"
                            className={`text-sm font-medium transition-colors ${isLight
                                ? 'text-indigo-600 hover:text-indigo-700'
                                : 'text-[#3b82f6] hover:text-blue-400'}`}>
                            Login
                        </Link>
                        <Link href="/register"
                            className="px-5 py-2.5 rounded-lg bg-[#3b82f6] text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                            Get Started
                        </Link>
                        <div className="ml-2"><ThemeToggle /></div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-gray-300'}`}
                            aria-label="Toggle menu">
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`md:hidden border-b ${isLight ? 'bg-white border-gray-100' : 'bg-[#080C16] border-white/5'}`}
                    >
                        <div className="px-4 py-6 space-y-4">
                            <div className="space-y-4">
                                <p className="px-3 text-xs font-bold uppercase tracking-widest text-gray-500">Solutions</p>
                                {platformSolutions.map(item => (
                                    <Link key={item.id} href={`/solutions/${item.id}`}
                                        className={`flex items-center gap-4 p-3 rounded-xl ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}
                                        onClick={() => setMobileMenuOpen(false)}>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} text-white`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.title}</span>
                                    </Link>
                                ))}
                            </div>
                            <div className={`pt-4 border-t ${isLight ? 'border-gray-100' : 'border-white/5'} space-y-2`}>
                                {[
                                    { label: 'Blog', href: '/blog' },
                                    { label: 'Pricing', href: '/pricing' },
                                    { label: 'Login', href: '/login' }
                                ].map(item => (
                                    <Link key={item.href} href={item.href}
                                        className={`block px-3 py-3 rounded-lg font-bold ${isLight ? 'text-gray-900 hover:bg-gray-50' : 'text-white hover:bg-white/5'}`}
                                        onClick={() => setMobileMenuOpen(false)}>
                                        {item.label}
                                    </Link>
                                ))}
                                <Link href="/register"
                                    className="block px-3 py-4 rounded-xl bg-blue-600 text-white font-bold text-center shadow-lg shadow-blue-500/20"
                                    onClick={() => setMobileMenuOpen(false)}>
                                    Get Started Free
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
