'use client';

import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function GuidesListPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    const GUIDES = [
        { title: 'Best Placement Tools for Students', href: '/compare/guides/student-tools', desc: 'A complete handbook on coding sandboxes, resume optimization models, and visual portfolio construction.', tag: 'Student Prep' },
        { title: 'Best Platforms for Campus Sourcing', href: '/compare/guides/campus-hiring', desc: 'A resource guide for recruitment managers on managing batches of candidates, conducting remote code screens, and visual pipelines.', tag: 'Recruiter TA' },
    ];

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                }`}>
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mb-12">
                    <h1 className="font-display mb-4 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700 }}>
                        Guides & eBooks
                    </h1>
                    <p className={`text-lg leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Explore in-depth placement guides and resources designed to help both students and recruiters excel.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {GUIDES.map((guide, idx) => (
                        <div key={idx} className={`p-6 rounded-2xl border flex flex-col justify-between ${
                            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                        }`}>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border mb-4 inline-block" style={{
                                    borderColor: isLight ? 'rgba(27, 95, 216, 0.3)' : 'rgba(43, 127, 255, 0.3)',
                                    color: activeColor,
                                    backgroundColor: isLight ? 'rgba(27, 95, 216, 0.02)' : 'rgba(43, 127, 255, 0.02)',
                                }}>
                                    {guide.tag}
                                </span>
                                <h3 className="font-display text-lg font-bold mb-3">{guide.title}</h3>
                                <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>{guide.desc}</p>
                            </div>
                            <Link href={guide.href} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:gap-2.5 transition-all animate-ease-out-expo" style={{ color: activeColor }}>
                                Read Guide <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
