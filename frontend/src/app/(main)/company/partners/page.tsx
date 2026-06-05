'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, GraduationCap, Users, BarChart3 } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PartnershipsPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    const [submitted, setSubmitted] = useState(false);
    const [collegeName, setCollegeName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                }`}>
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mb-12">
                    <h1 className="font-display mb-4 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700 }}>
                        Partner with PlaceNxt
                    </h1>
                    <p className={`text-lg leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Bring automated screening, verified assessments, and AI mock prep to your university or college placement cell.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Benefits List */}
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#2B7FFF] flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base mb-1">Co-Branded Portals</h3>
                                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                    Set up a dedicated domain for your college that students and recruiters can interact with natively.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#2B7FFF] flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base mb-1">Consolidated Batch Analytics</h3>
                                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                    Track student preparation rates, code scores, and verbal logic dashboards in a single view.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#2B7FFF] flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-base mb-1">Direct Recruiter Access</h3>
                                <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                    Route verified student profiles directly to hiring pools for top placement partners.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Partnership Sign Up */}
                    <div>
                        {submitted ? (
                            <div className={`p-8 rounded-2xl text-center border ${
                                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                            }`}>
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                <h3 className="font-display text-lg font-bold mb-2">Request Received!</h3>
                                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                    Our partnership success team will get in touch with you shortly to set up a dashboard demo.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={`p-6 rounded-2xl border space-y-4 ${
                                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                            }`}>
                                <h3 className="font-display font-bold text-base mb-2">University Inquiry Form</h3>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider">Institution Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={collegeName}
                                        onChange={e => setCollegeName(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
                                            isLight
                                                ? 'bg-white border-slate-200 text-slate-900 focus:border-[#1B5FD8] focus:ring-2'
                                                : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white focus:border-[#2B7FFF]/50 focus:ring-2'
                                        }`}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider">Contact Person</label>
                                    <input
                                        type="text"
                                        required
                                        value={contactName}
                                        onChange={e => setContactName(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
                                            isLight
                                                ? 'bg-white border-slate-200 text-slate-900 focus:border-[#1B5FD8] focus:ring-2'
                                                : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white focus:border-[#2B7FFF]/50 focus:ring-2'
                                        }`}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider">Work Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${
                                            isLight
                                                ? 'bg-white border-slate-200 text-slate-900 focus:border-[#1B5FD8] focus:ring-2'
                                                : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white focus:border-[#2B7FFF]/50 focus:ring-2'
                                        }`}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.01]"
                                    style={{ backgroundColor: activeColor }}
                                >
                                    Submit Inquiry
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
