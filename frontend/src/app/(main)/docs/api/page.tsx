'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code, CornerDownRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const ENDPOINTS = [
    {
        name: 'Vett Candidates List',
        method: 'GET',
        path: '/api/v1/recruiter/candidates',
        desc: 'Retrieve candidates with verified skill badges and cumulative code scores.',
        response: `{
  "status": "success",
  "data": [
    {
      "id": "cand_948fha",
      "name": "Arjun Mehta",
      "atsScore": 91,
      "badges": ["Java Core", "System Design"],
      "placementReady": true
    }
  ]
}`
    },
    {
        name: 'Register Placement Drive',
        method: 'POST',
        path: '/api/v1/university/drives',
        desc: 'Register a new placement batch drive and auto-generate invite links.',
        response: `{
  "status": "success",
  "data": {
    "driveId": "drive_83hfj92",
    "batchName": "2026 CS Engineering",
    "inviteUrl": "https://placenxt.com/join/drive_83hfj92"
  }
}`
    }
];

export default function ApiDocsPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const brandBlue = '#1B5FD8';
    const darkAccent = '#2B7FFF';
    const activeColor = isLight ? brandBlue : darkAccent;

    const [activeIdx, setActiveIdx] = useState(0);

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
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <Link href="/" className={`inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors duration-150 ${
                    isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8FA5C7] hover:text-white'
                }`}>
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="mb-10 pb-6 border-b" style={{ borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: activeColor }}>
                        <Code className="w-4 h-4" /> Developer Documentation
                    </div>
                    <h1 className="font-display mb-4 tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700 }}>
                        API Reference
                    </h1>
                    <p className={`text-lg leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                        Integrate verified candidate scoring pipelines and university batch portals into your ATS.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left endpoints sidebar */}
                    <div className="md:col-span-4 space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Endpoints</h4>
                        {ENDPOINTS.map((ep, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIdx(idx)}
                                className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between group ${
                                    activeIdx === idx
                                        ? isLight
                                            ? 'bg-white border-[#1B5FD8] shadow-sm'
                                            : 'bg-[#091324] border-[#2B7FFF]'
                                        : isLight
                                            ? 'bg-transparent border-slate-200 hover:bg-white'
                                            : 'bg-transparent border-white/[0.06] hover:bg-white/[0.02]'
                                }`}
                            >
                                <div>
                                    <span className="text-[10px] font-bold mr-2 uppercase" style={{ color: ep.method === 'GET' ? '#10B981' : '#F59E0B' }}>
                                        {ep.method}
                                    </span>
                                    <span className="font-medium">{ep.name}</span>
                                </div>
                                <CornerDownRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: activeColor }} />
                            </button>
                        ))}
                    </div>

                    {/* Right endpoint details panel */}
                    <div className="md:col-span-8 space-y-6">
                        <div className={`p-6 rounded-2xl border ${
                            isLight ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2.5 py-1 rounded text-xs font-bold text-white uppercase" style={{ backgroundColor: ENDPOINTS[activeIdx].method === 'GET' ? '#10B981' : '#F59E0B' }}>
                                    {ENDPOINTS[activeIdx].method}
                                </span>
                                <code className="text-sm font-mono font-bold">{ENDPOINTS[activeIdx].path}</code>
                            </div>
                            <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-[#8FA5C7]'}`}>
                                {ENDPOINTS[activeIdx].desc}
                            </p>

                            <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Response Payload (JSON)</h4>
                            <pre className="p-4 rounded-xl font-mono text-xs overflow-x-auto text-[#cbd5e1] bg-[#050B18] border border-white/[0.06]">
                                {ENDPOINTS[activeIdx].response}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Footer />
    </div>
    );
}
