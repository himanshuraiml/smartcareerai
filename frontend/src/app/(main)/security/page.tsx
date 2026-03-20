'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Lock, Eye, Server, Award, CheckCircle2, ArrowRight, Key, Cloud, RefreshCw } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTheme } from '@/providers/ThemeProvider';

const PILLARS = [
    {
        icon: Lock,
        title: 'Data Encryption',
        desc: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your resume, assessments, and interview recordings are stored in isolated, encrypted buckets.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Key,
        title: 'Identity & Access',
        desc: 'Role-based access control (RBAC) ensures students, recruiters, and admins only see what they\'re supposed to. JWT tokens expire and rotate automatically.',
        color: 'from-violet-500 to-purple-500',
    },
    {
        icon: Eye,
        title: 'Privacy by Design',
        desc: 'Candidate data is never sold. Recruiters see anonymized profiles unless you explicitly opt-in. GDPR and DPDP Act compliant.',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Server,
        title: 'Infrastructure Security',
        desc: 'Hosted on AWS with VPC isolation, WAF, DDoS protection, and regular penetration testing. 99.9% uptime SLA.',
        color: 'from-orange-500 to-amber-500',
    },
    {
        icon: Cloud,
        title: 'Data Residency',
        desc: 'Student data for Indian institutions is stored in AWS ap-south-1 (Mumbai) to comply with data localization requirements.',
        color: 'from-blue-600 to-indigo-600',
    },
    {
        icon: RefreshCw,
        title: 'Backup & Recovery',
        desc: 'Automated daily backups with 30-day retention. Point-in-time recovery for all critical databases. RTO < 4 hours, RPO < 1 hour.',
        color: 'from-pink-500 to-rose-500',
    },
];

const CERTIFICATIONS = [
    { name: 'ISO 27001', desc: 'Information Security Management', status: 'In Progress' },
    { name: 'SOC 2 Type II', desc: 'Security & Availability', status: 'In Progress' },
    { name: 'GDPR', desc: 'EU Data Protection', status: 'Compliant' },
    { name: 'DPDP Act', desc: 'India Data Protection', status: 'Compliant' },
];

const PRACTICES = [
    'Regular third-party penetration testing',
    'OWASP Top 10 vulnerability assessments',
    'Automated dependency scanning (Dependabot)',
    'Secret scanning on all code commits',
    'Security training for all engineers',
    '24/7 incident monitoring and alerting',
    'Responsible disclosure / bug bounty program',
    'Annual security audits by independent firms',
];

export default function SecurityPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const cardStyle = isLight
        ? { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
        : { background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6">
                            <Shield className="w-4 h-4" /> Security & Trust
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-600">
                            Your Data is Safe<br />with PlaceNxt
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            We handle millions of resumes, interview recordings, and personal profiles every month. Security isn't an afterthought — it's built into everything we do.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Trust Stats */}
            <section className="pb-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { value: '99.9%', label: 'Platform Uptime' },
                            { value: 'AES-256', label: 'Encryption Standard' },
                            { value: '< 24h', label: 'Incident Response' },
                            { value: '0', label: 'Data Breaches' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-5 text-center"
                                style={cardStyle}
                            >
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{stat.value}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Pillars */}
            <section className="py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black mb-3">Security Architecture</h2>
                        <p className="text-gray-500 dark:text-gray-400">Multiple layers of protection at every level of the stack.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PILLARS.map((pillar, i) => (
                            <motion.div
                                key={pillar.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="rounded-2xl p-6"
                                style={cardStyle}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 shadow-lg`}>
                                    <pillar.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{pillar.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{pillar.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Certifications */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black mb-3">Compliance & Certifications</h2>
                        <p className="text-gray-500 dark:text-gray-400">We meet the highest industry standards for security and privacy.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {CERTIFICATIONS.map((cert, i) => (
                            <motion.div
                                key={cert.name}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-5 text-center"
                                style={cardStyle}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-md">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-black text-lg mb-0.5">{cert.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{cert.desc}</p>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${cert.status === 'Compliant' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                                    {cert.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Practices */}
            <section className="py-8 pb-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="rounded-2xl p-8" style={cardStyle}>
                        <h2 className="text-2xl font-black mb-6">Our Security Practices</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PRACTICES.map((practice, i) => (
                                <motion.div
                                    key={practice}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{practice}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Report Vulnerability */}
            <section className="pb-16 px-4">
                <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-emerald-600 to-blue-700 p-10 text-white">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h2 className="text-2xl font-black mb-3">Found a Vulnerability?</h2>
                    <p className="text-emerald-100 mb-6 text-sm max-w-lg mx-auto">
                        We take security reports seriously. If you've found a potential issue, please reach out responsibly. We'll respond within 24 hours and offer recognition for valid reports.
                    </p>
                    <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors">
                        Report a Vulnerability <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
