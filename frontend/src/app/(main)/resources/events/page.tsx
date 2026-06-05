'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Video } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function EventsListPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    const EVENTS = [
        {
            title: 'Cracking the Placement coding Round with AI',
            desc: 'Learn how to leverage proctored coding sandboxes, build verified skill profiles, and prepare verbal logic.',
            date: 'June 18, 2026',
            time: '4:00 PM IST',
            type: 'Live Webinar',
        },
        {
            title: 'Transitioning from spreadsheet Logs to Sourcing Engines',
            desc: 'A masterclass for recruiter and placement officers on tracking university talent pools and automating vetting.',
            date: 'July 02, 2026',
            time: '11:00 AM IST',
            type: 'Technical Panel',
        }
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
                        Events & Webinars
                    </h1>
                    <p className={`text-lg leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Join our technical webinars and recruitment panels to keep up with the changing early-career trends.
                    </p>
                </div>

                <div className="space-y-6 mb-16">
                    {EVENTS.map((event, idx) => (
                        <div key={idx} className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                        }`}>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider" style={{ color: activeColor }}>
                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                    <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {event.time}</span>
                                </div>
                                <h3 className="font-display text-lg font-bold">{event.title}</h3>
                                <p className={`text-sm leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>{event.desc}</p>
                            </div>
                            <button
                                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] self-start md:self-auto flex-shrink-0"
                                style={{ backgroundColor: activeColor }}
                            >
                                Register Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
