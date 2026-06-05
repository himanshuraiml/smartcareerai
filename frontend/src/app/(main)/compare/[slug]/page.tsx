'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ArrowRight, ArrowLeft, Zap, ChevronRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { COMPARE_ITEMS } from '@/data/compare-content';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const ALL_COMPARISONS = [
    { slug: 'unstop', label: 'vs Unstop' },
    { slug: 'hackerrank', label: 'vs HackerRank' },
    { slug: 'hackerearth', label: 'vs HackerEarth' },
    { slug: 'internshala', label: 'vs Internshala' },
    { slug: 'imocha', label: 'vs iMocha' },
    { slug: 'talview', label: 'vs Talview' },
];

export default function ComparePage() {
    const params = useParams();
    const slug = params.slug as string;
    const item = COMPARE_ITEMS[slug];

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

            {!isLight && (
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(43,127,255,0.06) 0%, transparent 70%)' }}
                />
            )}

            <div className="pt-28 pb-24 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">

                    {/* Back nav */}
                    <Link
                        href="/"
                        className={`inline-flex items-center gap-2 text-sm font-semibold mb-10 transition-colors ${
                            isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                        }`}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    {/* Hero */}
                    <div className="text-center mb-12">
                        <span
                            className="px-3 py-1 rounded-full text-xs font-semibold mb-5 border uppercase tracking-wider inline-block"
                            style={{
                                borderColor: isLight ? 'rgba(27,95,216,0.3)' : 'rgba(43,127,255,0.3)',
                                color: activeColor,
                                backgroundColor: isLight ? 'rgba(27,95,216,0.05)' : 'rgba(43,127,255,0.05)',
                            }}
                        >
                            {item.heroLabel}
                        </span>

                        {/* VS display */}
                        <div className="flex items-center justify-center gap-4 mb-5 mt-4">
                            <span className="font-display font-extrabold text-3xl sm:text-4xl" style={{ color: activeColor }}>PlaceNxt</span>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${
                                isLight ? 'bg-slate-200 text-slate-500' : 'bg-white/10 text-slate-400'
                            }`}>vs</span>
                            <span className={`font-display font-extrabold text-3xl sm:text-4xl ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                {item.competitorName}
                            </span>
                        </div>

                        <h1 className={`font-display tracking-tight mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}
                            style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)', fontWeight: 600, lineHeight: 1.4 }}>
                            {item.subtitle}
                        </h1>
                    </div>

                    {/* Stats Bar */}
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-px mb-12 rounded-2xl overflow-hidden border ${
                        isLight ? 'bg-slate-200 border-slate-200' : 'bg-white/[0.06] border-white/[0.06]'
                    }`}>
                        {item.stats.map((stat, i) => (
                            <div key={i} className={`p-5 text-center ${isLight ? 'bg-white' : 'bg-[#091324]'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {stat.label}
                                </p>
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <span className="text-sm font-bold" style={{ color: activeColor }}>{stat.placenxt}</span>
                                    <span className={`text-xs ${isLight ? 'text-slate-300' : 'text-white/20'}`}>vs</span>
                                    <span className={`text-sm font-medium line-through ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{stat.competitor}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Two-Column Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* PlaceNxt */}
                        <div className={`p-7 rounded-2xl border ${
                            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.14)]'
                        }`}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activeColor }}>PlaceNxt</span>
                            </div>
                            <h3 className={`font-display text-lg font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                The PlaceNxt Advantage
                            </h3>
                            <p className={`text-sm leading-relaxed mb-5 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                {item.description}
                            </p>
                            <div className="space-y-3">
                                {item.whyBetter.map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-emerald-500" />
                                        </div>
                                        <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Competitor */}
                        <div className={`p-7 rounded-2xl border ${
                            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
                        }`}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {item.competitorName}
                                </span>
                            </div>
                            <h3 className={`font-display text-lg font-bold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                {item.competitorTagline}
                            </h3>
                            <p className={`text-sm leading-relaxed mb-5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                {item.competitorDescription}
                            </p>
                            <div className="space-y-3">
                                {item.competitorWeaknesses.map((point, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <X className="w-3 h-3 text-red-400" />
                                        </div>
                                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{point}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Why Teams Switch */}
                    <div className="mb-12">
                        <h2 className={`font-display text-xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Why teams switch from {item.competitorName}
                        </h2>
                        <p className={`text-sm mb-6 ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]'}`}>
                            The most common reasons placement teams and recruiters migrate to PlaceNxt.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {item.switchReasons.map((reason, i) => (
                                <div key={i} className={`p-5 rounded-xl border ${
                                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.1)]'
                                }`}>
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                                        style={{ backgroundColor: isLight ? 'rgba(27,95,216,0.08)' : 'rgba(43,127,255,0.1)' }}
                                    >
                                        <Zap className="w-4 h-4" style={{ color: activeColor }} />
                                    </div>
                                    <h4 className={`font-semibold text-sm mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        {reason.title}
                                    </h4>
                                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-[#8FA5C7]'}`}>
                                        {reason.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Matrix */}
                    <div className="mb-14">
                        <h2 className={`font-display text-xl font-bold mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Feature Comparison
                        </h2>
                        <div className={`border rounded-2xl overflow-hidden ${
                            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                        }`}>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${
                                        isLight
                                            ? 'bg-slate-50 border-slate-200 text-slate-500'
                                            : 'bg-white/[0.02] border-white/[0.08] text-[#8FA5C7]/70'
                                    }`}>
                                        <th className="p-4 sm:p-5 w-[42%]">Feature</th>
                                        <th className="p-4 sm:p-5 w-[29%]" style={{ color: activeColor }}>PlaceNxt</th>
                                        <th className="p-4 sm:p-5 w-[29%]">{item.competitorName}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.matrix.map((row, i) => (
                                        <tr key={i} className={`border-b last:border-0 text-sm transition-colors ${
                                            isLight
                                                ? 'border-slate-100 hover:bg-blue-50/30'
                                                : 'border-white/[0.05] hover:bg-white/[0.02]'
                                        }`}>
                                            <td className={`p-4 sm:p-5 font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                                {row.feature}
                                            </td>
                                            <td className="p-4 sm:p-5">
                                                {typeof row.placenxt === 'boolean' ? (
                                                    row.placenxt ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <Check className="w-4 h-4" /> Included
                                                        </span>
                                                    ) : (
                                                        <X className="w-4 h-4 text-red-400" />
                                                    )
                                                ) : (
                                                    <span className="text-sm font-semibold" style={{ color: activeColor }}>{row.placenxt}</span>
                                                )}
                                            </td>
                                            <td className="p-4 sm:p-5">
                                                {typeof row.competitor === 'boolean' ? (
                                                    row.competitor ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <Check className="w-4 h-4" /> Included
                                                        </span>
                                                    ) : (
                                                        <X className="w-4 h-4 text-red-400" />
                                                    )
                                                ) : (
                                                    <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{row.competitor}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* CTA Banner */}
                    <div className={`p-10 rounded-2xl text-center relative overflow-hidden mb-14 ${
                        isLight
                            ? 'bg-gradient-to-br from-[#1B5FD8] to-[#0A3D9A]'
                            : 'bg-gradient-to-br from-[#0E1E38] to-[#050B18] border border-[rgba(43,127,255,0.2)]'
                    }`}>
                        {!isLight && (
                            <div className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(43,127,255,0.1) 0%, transparent 70%)' }} />
                        )}
                        <div className="relative z-10">
                            <h3 className="font-display text-2xl font-bold text-white mb-3">
                                {item.ctaText}
                            </h3>
                            <p className={`text-sm mb-7 max-w-md mx-auto ${isLight ? 'text-blue-100' : 'text-[#8FA5C7]'}`}>
                                See how PlaceNxt's full-stack career platform transforms placement results for students, recruiters, and institutions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link
                                    href={item.ctaHref}
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-white text-[#1B5FD8] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Request a Demo <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    View Pricing
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Browse other comparisons */}
                    <div>
                        <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            Browse other comparisons
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {ALL_COMPARISONS.filter(c => c.slug !== slug).map(c => (
                                <Link
                                    key={c.slug}
                                    href={`/compare/${c.slug}`}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-[1.02] ${
                                        isLight
                                            ? 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                                            : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-[rgba(43,127,255,0.4)] hover:text-white'
                                    }`}
                                >
                                    PlaceNxt {c.label} <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
}
