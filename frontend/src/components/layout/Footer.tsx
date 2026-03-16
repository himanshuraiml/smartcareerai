'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/providers/ThemeProvider';
import Logo from '@/components/layout/Logo';

export default function Footer() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    return (
        <footer className={`pt-16 pb-8 px-4 ${isLight ? 'bg-indigo-600 text-white' : 'bg-[#0B0F19] border-t border-white/[0.06] text-gray-300'}`}>
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-6">
                            <Logo variant="dark" width={180} height={60} />
                        </Link>
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-indigo-100' : 'text-gray-400'}`}>
                            Empowering the next generation of talent with AI-driven placement preparation and intelligent hiring.
                        </p>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className={`text-sm font-bold tracking-wider uppercase mb-6 ${isLight ? 'text-white' : 'text-gray-200'}`}>PlaceNxt</h4>
                            <ul className="space-y-4 text-sm">
                                <li><Link href="/solutions" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Platform</Link></li>
                                <li><Link href="/contact" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Get a Demo</Link></li>
                                <li><Link href="/solutions/students" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>For Students</Link></li>
                                <li><Link href="/solutions/university" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>For Universities</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className={`text-sm font-bold tracking-wider uppercase mb-6 ${isLight ? 'text-white' : 'text-gray-200'}`}>Resources</h4>
                            <ul className="space-y-4 text-sm">
                                <li><Link href="/blog" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>PlaceNxt Blog</Link></li>
                                <li><Link href="/resources" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Resource Library</Link></li>
                                <li><Link href="/success-stories" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Success Stories</Link></li>
                                <li><Link href="/pricing" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Pricing Plans</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className={`text-sm font-bold tracking-wider uppercase mb-6 ${isLight ? 'text-white' : 'text-gray-200'}`}>Solutions</h4>
                            <ul className="space-y-4 text-sm">
                                <li><Link href="/solutions/students" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Skill Validation</Link></li>
                                <li><Link href="/solutions/university" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>AI Mock Interviews</Link></li>
                                <li><Link href="/solutions/recruiter" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Candidate Sourcing</Link></li>
                                <li><Link href="/security" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Security & Trust</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className={`text-sm font-bold tracking-wider uppercase mb-6 ${isLight ? 'text-white' : 'text-gray-200'}`}>Company</h4>
                            <ul className="space-y-4 text-sm">
                                <li><Link href="/about" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>About Us</Link></li>
                                <li><Link href="/careers" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Careers</Link></li>
                                <li><Link href="/contact" className={`transition-colors ${isLight ? 'text-indigo-100 hover:text-white' : 'text-gray-400 hover:text-white'}`}>Contact Us</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${isLight ? 'border-indigo-500' : 'border-white/5'}`}>
                    <p className={`text-xs ${isLight ? 'text-indigo-200' : 'text-gray-500'}`}>
                        © {new Date().getFullYear()} PlaceNxt AI. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className={`text-xs transition-colors ${isLight ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-white'}`}>Privacy Policy</Link>
                        <Link href="/terms" className={`text-xs transition-colors ${isLight ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-white'}`}>Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
