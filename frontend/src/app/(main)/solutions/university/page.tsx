'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import {
    Building2, LineChart, BrainCircuit, Database,
    ShieldCheck, Network, LayoutDashboard, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function UniversitySolutionPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <div className={`min-h-screen ${isLight ? 'bg-[#F8FAFC]' : 'bg-[#080C16]'}`}>
            <Navbar />

            {/* Hero Section */}
            <header className="max-w-7xl mx-auto px-4 mt-40 mb-24">
                <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1"
                    >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${isLight
                            ? 'bg-purple-50 border-purple-100 text-purple-600'
                            : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                            <Building2 className="w-3 h-3" /> For Universities & Institutions
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Supercharge Your <span className="text-purple-500">Placement ROI.</span>
                        </h1>
                        <p className={`text-lg md:text-xl leading-relaxed mb-8 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            Empower your placement cell with real-time analytics, identifying skill gaps across batches, and providing every student an elite-level preparation platform.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/contact" className="px-8 py-4 rounded-2xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-transform">
                                Book Institutional Demo
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 relative"
                    >
                        <div className={`aspect-video rounded-3xl border overflow-hidden relative ${isLight ? 'bg-white border-gray-100 shadow-2xl' : 'bg-white/5 border-white/10'}`}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                            <div className="absolute inset-10 flex flex-col justify-end gap-2 items-center">
                                <div className={`w-full h-[70%] rounded-xl shadow-lg border backdrop-blur-md p-6 flex items-end justify-between gap-3 ${isLight ? 'bg-white/80 border-white' : 'bg-[#0f172a]/80 border-gray-700'}`}>
                                    {[40, 75, 55, 95, 70, 85].map((h, i) => (
                                        <div key={i} className="w-full bg-purple-500/40 rounded-t-lg relative group">
                                            <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 1 }} className="absolute bottom-0 w-full bg-purple-500 rounded-t-lg" />
                                        </div>
                                    ))}
                                </div>
                                <div className={`w-full h-[30%] rounded-xl shadow-lg border backdrop-blur-md p-4 flex items-center justify-between ${isLight ? 'bg-white/80 border-white' : 'bg-[#0f172a]/80 border-gray-700'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-r-transparent animate-spin-slow"></div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-32 rounded bg-purple-500/20" />
                                            <div className="h-2 w-20 rounded bg-gray-500/10" />
                                        </div>
                                    </div>
                                    <div className="h-8 w-24 rounded-lg bg-purple-500/10 border border-purple-500/20" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* University Feature Grid */}
            <section className="max-w-7xl mx-auto px-4 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: LineChart,
                            title: 'Batch Performance Tracking',
                            desc: 'Identify top performers and students needing immediate attention across multiple departments and batches simultaneously.',
                            color: 'purple'
                        },
                        {
                            icon: BrainCircuit,
                            title: 'Skill Gap Analytics',
                            desc: 'Leverage data to understand where your curriculum needs industry alignment. Identify missing technical or soft skill trends.',
                            color: 'fuchsia'
                        },
                        {
                            icon: ShieldCheck,
                            title: 'White-Labeled Institutional Portal',
                            desc: 'Maintain your prestige. Every student interacts with an elite placement tool fully branded with your university identity.',
                            color: 'indigo'
                        },
                        {
                            icon: Database,
                            title: 'Corporate Talent Export',
                            desc: 'Push vetted student profiles and verified skill badges directly to HR portals of top recruitment partners.',
                            color: 'violet'
                        },
                        {
                            icon: Network,
                            title: 'Unified Alumni Network',
                            desc: 'Track placement success after graduation and leverage alumni success to inspire and mentor current junior batches.',
                            color: 'blue'
                        },
                        {
                            icon: LayoutDashboard,
                            title: 'Automated Placement Reports',
                            desc: 'Generate comprehensive ROI and placement statistics reports for accreditation, rankings, and management reviews.',
                            color: 'pink'
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`p-10 rounded-[40px] border transition-all hover:shadow-2xl ${isLight ? 'bg-white border-gray-100 hover:border-purple-200' : 'bg-white/5 border-white/5 hover:border-purple-500/30'}`}
                        >
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 bg-${feature.color}-500/10 text-${feature.color}-500`}>
                                <feature.icon className="w-8 h-8" />
                            </div>
                            <h3 className={`text-2xl font-bold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>{feature.title}</h3>
                            <p className={`leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Integration CTA */}
            <section className="max-w-7xl mx-auto px-4 mb-32">
                <div className={`rounded-[32px] p-8 md:p-20 text-center relative overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className={`text-3xl md:text-5xl font-black mb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            Deploy in under 48 hours.
                        </h2>
                        <p className={`text-lg mb-10 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            No complex setup. No long integration cycles. Just a powerful solution that starts delivering value to your students instantly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link href="/contact" className="px-10 py-5 rounded-2xl bg-purple-600 text-white font-black text-lg hover:scale-[1.05] transition-transform shadow-xl shadow-purple-500/20">
                                Schedule a Platform Demo
                            </Link>
                            <Link href="/case-studies" className={`px-10 py-5 rounded-2xl border font-black text-lg transition-colors ${isLight ? 'border-gray-300 text-gray-700 hover:bg-white' : 'border-white/10 text-white hover:bg-white/5'}`}>
                                View Case Studies
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
