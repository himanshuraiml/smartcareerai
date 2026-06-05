'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, User } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { GUIDE_ITEMS } from '@/data/compare-content';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function GuidePage() {
    const params = useParams();
    const slug = params.slug as string;
    const item = GUIDE_ITEMS[slug];

    const { theme } = useTheme();
    const isLight = theme === 'light';

    if (!item) {
        notFound();
    }

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    return (
        <div className={`min-h-screen overflow-hidden ${
            isLight ? 'bg-[#F7F9FC] text-slate-900' : 'bg-[#050B18] text-white'
        }`}>
            <Navbar />

            {/* Ambient glow */}
            {!isLight && (
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(43,127,255,0.06) 0%, transparent 70%)' }}
                />
            )}

            <div className="pt-32 pb-24 relative z-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Back button */}
                <Link
                    href="/"
                    className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                        isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                    }`}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                {/* Article Header */}
                <div className="border-b pb-8 mb-10" style={{ borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: activeColor }}>
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Best Guides</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Clock className="w-3.5 h-3.5" /> {item.readTime}</span>
                    </div>

                    <h1
                        className="font-display mb-4 tracking-tight"
                        style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 700, lineHeight: 1.15 }}
                    >
                        {item.title}
                    </h1>
                    <p className={`text-lg leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        {item.subtitle}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <User className="w-4 h-4" />
                        <span>By {item.author}</span>
                    </div>
                </div>

                {/* Article Sections */}
                <div className="space-y-10 mb-16">
                    {item.sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                            <h2 className="font-display text-lg sm:text-xl font-bold" style={{ color: isLight ? '#0F172A' : '#EFF4FB' }}>
                                {section.heading}
                            </h2>
                            <p className={`text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                {section.body}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom Newsletter Block */}
                <div className={`p-8 rounded-2xl border text-center ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                }`}>
                    <h3 className="font-display text-lg font-bold mb-2">Subscribe to our Newsletter</h3>
                    <p className={`text-sm mb-6 max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]'}`}>
                        Get the latest placement reports, career guides, and technical insights directly to your inbox.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="your.email@example.com"
                            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                                isLight
                                    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1B5FD8] focus:ring-2 focus:ring-[#1B5FD8]/15'
                                    : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white placeholder:text-[#4A6080] focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                            }`}
                        />
                        <button
                            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ backgroundColor: activeColor }}
                        >
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
