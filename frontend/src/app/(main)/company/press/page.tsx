'use client';

import Link from 'next/link';
import { ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PressPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                }`}>
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mb-12">
                    <h1 className="font-display mb-4 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700 }}>
                        Press & Media kit
                    </h1>
                    <p className={`text-lg leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Official PlaceNxt brand assets, guidelines, and press release materials.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Brand Logos */}
                    <div className={`p-6 rounded-2xl border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                    }`}>
                        <div className="flex items-center gap-3 mb-4 text-[#2B7FFF]">
                            <ImageIcon className="w-5 h-5" />
                            <h3 className="font-display font-bold text-base">Brand Logos</h3>
                        </div>
                        <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                            Download PlaceNxt official logos in high resolution (SVG and PNG vectors) for light and dark backgrounds.
                        </p>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02]" style={{ backgroundColor: activeColor }}>
                            <Download className="w-3.5 h-3.5" /> Download Logo Pack (.zip)
                        </button>
                    </div>

                    {/* Media Releases */}
                    <div className={`p-6 rounded-2xl border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                    }`}>
                        <div className="flex items-center gap-3 mb-4 text-[#2B7FFF]">
                            <FileText className="w-5 h-5" />
                            <h3 className="font-display font-bold text-base">Press Materials</h3>
                        </div>
                        <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                            Official press release guidelines, leadership biographies, and background research details on verified assessment methodologies.
                        </p>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02]" style={{ backgroundColor: activeColor }}>
                            <Download className="w-3.5 h-3.5" /> Download Media Kit (.pdf)
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
