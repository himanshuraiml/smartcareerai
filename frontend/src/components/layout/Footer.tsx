'use client';

import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';
import Logo from '@/components/layout/Logo';
import { Linkedin, Twitter, Github } from 'lucide-react';

const FOOTER_COLS = [
    {
        heading: 'Product',
        links: [
            { label: 'Platform Overview', href: '/solutions' },
            { label: 'For Students', href: '/solutions/students' },
            { label: 'For Recruiters', href: '/solutions/recruiter' },
            { label: 'For Institutions', href: '/solutions/university' },
            { label: 'Pricing', href: '/pricing' },
        ],
    },
    {
        heading: 'Resources',
        links: [
            { label: 'Blog', href: '/blog' },
            { label: 'Resource Library', href: '/resources' },
            { label: 'Success Stories', href: '/success-stories' },
            { label: 'Get a Demo', href: '/contact' },
        ],
    },
    {
        heading: 'Company',
        links: [
            { label: 'About Us', href: '/about' },
            { label: 'Careers', href: '/careers' },
            { label: 'Contact', href: '/contact' },
            { label: 'Security & Trust', href: '/security' },
        ],
    },
    {
        heading: 'Legal',
        links: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Cookie Policy', href: '/cookies' },
        ],
    },
];

export default function Footer() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const linkClass = `text-sm transition-colors duration-150 ${
        isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#4A6080] hover:text-[#8FA5C7]'
    }`;

    const headingClass = `text-[11px] font-semibold uppercase tracking-widest mb-5 ${
        isLight ? 'text-slate-400' : 'text-[#4A6080]'
    }`;

    return (
        <footer className={`pt-20 pb-8 px-4 ${
            isLight
                ? 'bg-[#F7F9FC] border-t border-slate-200/80'
                : 'bg-[#050B18] border-t border-[rgba(43,127,255,0.1)]'
        }`}>
            <div className="max-w-7xl mx-auto">
                {/* Top grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-x-8 gap-y-12 mb-16">
                    {/* Brand column — 2 cols wide */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-5">
                            <Logo width={140} height={46} />
                        </Link>
                        <p className={`text-sm leading-relaxed max-w-xs ${isLight ? 'text-slate-500' : 'text-[#4A6080]'}`}>
                            AI-powered career preparation platform for students, recruiters, and institutions.
                        </p>

                        {/* Social icons */}
                        <div className="flex items-center gap-3 mt-6">
                            {[
                                { Icon: Linkedin, href: 'https://linkedin.com/company/placenxt', label: 'LinkedIn' },
                                { Icon: Twitter, href: 'https://twitter.com/placenxt', label: 'X / Twitter' },
                                { Icon: Github, href: 'https://github.com/placenxt', label: 'GitHub' },
                            ].map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                                        isLight
                                            ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                            : 'text-[#4A6080] hover:text-[#8FA5C7] hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {FOOTER_COLS.map((col) => (
                        <div key={col.heading}>
                            <p className={headingClass}>{col.heading}</p>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className={linkClass}>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className={`pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${
                    isLight ? 'border-slate-200' : 'border-[rgba(43,127,255,0.08)]'
                }`}>
                    <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-[#4A6080]'}`}>
                        © {new Date().getFullYear()} PlaceNxt AI. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1">
                        <span className={`text-xs ${isLight ? 'text-slate-300' : 'text-[#4A6080]/60'}`}>Built with</span>
                        <span className="text-red-400 text-xs">♥</span>
                        <span className={`text-xs ${isLight ? 'text-slate-300' : 'text-[#4A6080]/60'}`}>for students across India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
