'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, FileText, CheckCircle } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SourcingReportPage() {
    const params = useParams();
    const slug = params.slug as string;

    const { theme } = useTheme();
    const isLight = theme === 'light';

    if (slug !== '2026-early-career') {
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

                <div className="mb-10 pb-8 border-b" style={{ borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: activeColor }}>
                        <FileText className="w-4 h-4" /> Research Report
                    </div>
                    <h1 className="font-display mb-4 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, lineHeight: 1.15 }}>
                        2026 Early-Career Sourcing Report
                    </h1>
                    <p className={`text-lg leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        A comprehensive survey on technical placement efficiency, skill verification, and recruiter hiring cycles.
                    </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    {[
                        { value: '80%', label: 'Hiring Time Reduction', desc: 'Pre-vetted pools remove manual resume filters' },
                        { value: '3.2x', label: 'Match Accuracy', desc: 'Verified skill badges drive direct alignment' },
                        { value: '94%', label: 'Integrity Rate', desc: 'Anti-cheat coding proctoring sandboxes' }
                    ].map((metric, i) => (
                        <div key={i} className={`p-5 rounded-xl border flex flex-col gap-1 ${
                            isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                        }`}>
                            <span className="text-3xl font-extrabold font-display" style={{ color: activeColor }}>{metric.value}</span>
                            <span className="text-xs font-bold uppercase tracking-wider mt-1">{metric.label}</span>
                            <span className={`text-[11px] leading-snug mt-1 ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]/70'}`}>{metric.desc}</span>
                        </div>
                    ))}
                </div>

                {/* Text sections */}
                <div className="space-y-8 mb-12">
                    <div className="space-y-3">
                        <h2 className="font-display text-xl font-bold flex items-center gap-2"><Award className="w-5 h-5" style={{ color: activeColor }} /> The Shift to Skill Verification</h2>
                        <p className={`text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                            Recruiters are abandoning traditional word-based resume keyword searches. As automated resume screening systems become standard, proving real competency is critical. PlaceNxt solves this by combining ATS checks with verified testing structures that are shareable.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-display text-xl font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" style={{ color: activeColor }} /> Connecting Campus to Career</h2>
                        <p className={`text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                            For colleges and universities, PlaceNxt replaces spreadsheet-based trackers and disconnected mock portals. By routing certified profiles through single batch analytics consoles, academic staff can review student readiness and connect them directly with hiring managers.
                        </p>
                    </div>
                </div>

                {/* Bottom CTA Block */}
                <div className={`p-8 rounded-2xl text-center border ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                }`}>
                    <h3 className="font-display text-lg font-bold mb-2">Want to improve your campus hiring efficiency?</h3>
                    <p className={`text-sm mb-6 max-w-md mx-auto ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]'}`}>
                        Set up a consolidated dashboard for your batches and recruiters.
                    </p>
                    <Link
                        href="/contact?type=demo"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: activeColor }}
                    >
                        Schedule a Demo
                    </Link>
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
