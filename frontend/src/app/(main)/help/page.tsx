'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const FAQS = [
    { q: 'How does the AI Resume Scorer calculate ATS scores?', a: 'Our scanner parses your resume to analyze formatting compliance, contact layout, and semantic skill matching against targeted job descriptions, returning an objective ATS rank.' },
    { q: 'How can colleges invite companies to PlaceNxt?', a: 'College admins can invite recruitment partners directly from the dashboard via email invitations, routing candidate pools directly into custom partner pipelines.' },
    { q: 'Are assessment badges proctored against cheating?', a: 'Yes. Technical tests use anti-cheat browser sandboxes and proctoring logs. Once verified, badges are locked and displayed on your public profile.' },
    { q: 'How do I start a mock video interview?', a: 'Navigate to the Practice Interview section under the Dashboard, choose a job role, and begin. Our AI will analyze your verbal replies and present visual radars.' }
];

export default function HelpCenterPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    const [search, setSearch] = useState('');
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    const filtered = FAQS.filter(faq =>
        faq.q.toLowerCase().includes(search.toLowerCase()) ||
        faq.a.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`min-h-screen overflow-hidden ${
            isLight ? 'bg-[#F7F9FC] text-slate-900' : 'bg-[#050B18] text-white'
        }`}>
            <Navbar />

            {!isLight && (
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(43,127,255,0.06) 0%, transparent 70%)' }}
                />
            )}

            <div className="pt-32 pb-24 relative z-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                }`}>
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mb-10 text-center">
                    <h1 className="font-display mb-4 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700 }}>
                        Help Center & FAQs
                    </h1>
                    <p className={`text-base leading-relaxed mb-6 max-w-lg mx-auto ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Search our help repository for immediate answers regarding proctoring, AI scoring, and recruiting.
                    </p>
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search answers..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                                isLight
                                    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1B5FD8] focus:ring-2 focus:ring-[#1B5FD8]/15'
                                    : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white placeholder:text-[#4A6080] focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                            }`}
                        />
                    </div>
                </div>

                <div className="space-y-3 mb-12">
                    {filtered.map((faq, i) => (
                        <div
                            key={i}
                            className={`rounded-xl border overflow-hidden transition-colors cursor-pointer ${
                                isLight ? 'border-slate-200 bg-white shadow-sm' : 'border-[rgba(43,127,255,0.1)] bg-[#091324]'
                            }`}
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                            >
                                <span className="font-semibold text-sm">{faq.q}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                                    openIdx === i ? 'rotate-180' : ''
                                }`} style={{ color: openIdx === i ? activeColor : undefined }} />
                            </button>
                            {openIdx === i && (
                                <p className={`px-5 pb-4 text-sm leading-relaxed ${
                                    isLight ? 'text-slate-500' : 'text-[#8FA5C7]'
                                }`}>
                                    {faq.a}
                                </p>
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-center text-sm text-slate-500 dark:text-[#8FA5C7]/70 py-8">
                            No answers found. Feel free to submit a support ticket!
                        </p>
                    )}
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
