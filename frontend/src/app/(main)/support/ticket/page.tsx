'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function SupportTicketPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    const [submitted, setSubmitted] = useState(false);
    const [subject, setSubject] = useState('');
    const [email, setEmail] = useState('');
    const [category, setCategory] = useState('technical');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

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
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                }`}>
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mb-10">
                    <h1 className="font-display mb-3 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 700 }}>
                        Submit a Ticket
                    </h1>
                    <p className={`text-base leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Need help with billing or code proctoring? Submit a ticket below, and our success team will follow up within 24 hours.
                    </p>
                </div>

                {submitted ? (
                    <div className={`p-8 rounded-2xl text-center border ${
                        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                    }`}>
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="font-display text-lg font-bold mb-2">Ticket Submitted Successfully!</h3>
                        <p className={`text-sm mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                            Thank you! Your ticket details have been logged. We will reach out to you via email.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ backgroundColor: activeColor }}
                        >
                            Submit Another Ticket
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={`p-6 rounded-2xl border space-y-5 ${
                        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                    }`}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                                    isLight
                                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1B5FD8] focus:ring-2 focus:ring-[#1B5FD8]/15'
                                        : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white placeholder:text-[#4A6080] focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                                }`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                                    isLight
                                        ? 'bg-white border-slate-200 text-slate-900 focus:border-[#1B5FD8] focus:ring-2 focus:ring-[#1B5FD8]/15'
                                        : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                                }`}
                            >
                                <option value="technical">Technical Bug / Issue</option>
                                <option value="billing">Billing & Subscriptions</option>
                                <option value="proctoring">Assessment & Proctoring</option>
                                <option value="general">Feedback & Other</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider">Subject</label>
                            <input
                                type="text"
                                required
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                                    isLight
                                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1B5FD8] focus:ring-2 focus:ring-[#1B5FD8]/15'
                                        : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white placeholder:text-[#4A6080] focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                                }`}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider">Message Description</label>
                            <textarea
                                required
                                rows={5}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${
                                    isLight
                                        ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#1B5FD8] focus:ring-2 focus:ring-[#1B5FD8]/15'
                                        : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white placeholder:text-[#4A6080] focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                                }`}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                            style={{ backgroundColor: activeColor }}
                        >
                            Submit Support Ticket
                        </button>
                    </form>
                )}
            </div>
        </div>
        <Footer />
    </div>
    );
}
