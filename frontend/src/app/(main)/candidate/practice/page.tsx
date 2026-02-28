'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Search, Code2, Briefcase, Zap, Trophy, PlayCircle, Loader2 } from 'lucide-react';
import { authFetchJson } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';

const COMPANIES = [
    {
        id: 'google',
        name: 'Google',
        type: 'Product',
        color: 'from-blue-500 to-red-500',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        tags: ['Algorithms', 'System Design', 'Googliness']
    },
    {
        id: 'microsoft',
        name: 'Microsoft',
        type: 'Product',
        color: 'from-blue-600 to-cyan-500',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%(2012%).svg',
        tags: ['Data Structures', 'System Design', 'Behavioral']
    },
    {
        id: 'amazon',
        name: 'Amazon',
        type: 'Product',
        color: 'from-orange-500 to-amber-600',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        tags: ['Leadership Principles', 'Object-Oriented Design', 'Scale']
    },
    {
        id: 'meta',
        name: 'Meta',
        type: 'Product',
        color: 'from-blue-600 to-indigo-600',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
        tags: ['Product Sense', 'Coding Speed', 'Architecture']
    },
    {
        id: 'apple',
        name: 'Apple',
        type: 'Product',
        color: 'from-gray-700 to-black dark:from-gray-300 dark:to-white',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
        tags: ['Domain Expertise', 'Culture Fit', 'Optimization']
    },
    {
        id: 'netflix',
        name: 'Netflix',
        type: 'Product',
        color: 'from-red-600 to-red-800',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
        tags: ['Culture Deck', 'Distributed Systems', 'Ownership']
    },
    {
        id: 'nvidia',
        name: 'NVIDIA',
        type: 'Product',
        color: 'from-green-500 to-lime-600',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg',
        tags: ['C++', 'CUDA', 'Deep Learning', 'Systems']
    },
    {
        id: 'tcs',
        name: 'TCS',
        type: 'Service',
        color: 'from-blue-700 to-indigo-800',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
        tags: ['Core OOPs', 'Aptitude', 'Java/C++']
    },
    {
        id: 'infosys',
        name: 'Infosys',
        type: 'Service',
        color: 'from-blue-600 to-blue-800',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
        tags: ['Database', 'Web Tech', 'Puzzles']
    },
    {
        id: 'wipro',
        name: 'Wipro',
        type: 'Service',
        color: 'from-pink-600 to-purple-600',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg',
        tags: ['SDLC', 'SQL', 'Communication']
    }
];

export default function CandidatePracticeHub() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<typeof COMPANIES[0] | null>(null);
    const [role, setRole] = useState('Software Engineer');
    const [isStarting, setIsStarting] = useState(false);

    const filteredCompanies = COMPANIES.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleStartMock = async () => {
        if (!selectedCompany) return;
        setIsStarting(true);
        try {
            // Create a session tailored to this company
            const roleStr = `${selectedCompany.name} ${role}`;
            const diff = selectedCompany.type === 'Product' ? 'HARD' : 'MEDIUM';
            const typeVar = 'MIXED';

            const createRes = await authFetchJson('/interviews/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    type: typeVar,
                    targetRole: roleStr,
                    difficulty: diff,
                    format: 'VIDEO'
                })
            });

            if (createRes.error || !createRes.data) throw new Error(createRes.error || 'Failed to create session');
            const sessionId = createRes.data.id;

            // Redirect to the actual Candidate Interview Room (reusing [jobId] room, but without a job)
            // Wait, the regular room needs a jobId. Let me check if we can bypass it or use it as a generic room.
            // Actually, we should redirect to `/candidate/practice/room/${sessionId}` which doesn't exist yet,
            // OR we redirect to `/interviews/${sessionId}` which might be a generic room.
            // Let's create `/candidate/practice/room/[sessionId]/page.tsx` for the Mock session.
            router.push(`/candidate/practice/room/${sessionId}`);
        } catch (err: any) {
            alert('Error starting mock interview: ' + err.message);
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black pt-16 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="text-left w-full max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-sm font-bold mb-6 backdrop-blur-md">
                            <Trophy className="w-4 h-4 text-yellow-400" /> Company Packs
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
                            Crack Your Dream Company Interview
                        </h1>
                        <p className="text-lg md:text-xl text-indigo-100/90 leading-relaxed font-medium">
                            Practice with highly realistic mock interviews tailored to the specific rubric, style, and question patterns of top tech product and service companies.
                        </p>
                    </div>
                    {/* Floating Illustration */}
                    <div className="hidden md:flex relative w-64 h-64 shrink-0">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[100px] opacity-40"></div>
                        <div className="relative w-full h-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col p-6 items-center justify-center transform hover:-translate-y-2 transition duration-500 hover:rotate-2">
                            <Building2 className="w-20 h-20 text-indigo-300 mb-4 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)]" />
                            <div className="h-2 w-24 bg-white/20 rounded-full mb-3"></div>
                            <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
                {/* Search / Filter Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 p-4 border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-4 mb-10 backdrop-blur-xl">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search companies (e.g. Google, Data Structures...)"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 dark:text-white transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-indigo-500" /> Product
                        </button>
                        <button className="px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-500" /> Service
                        </button>
                    </div>
                </div>

                {/* Companies Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCompanies.map(company => (
                        <div
                            key={company.id}
                            onClick={() => setSelectedCompany(company)}
                            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${company.color} opacity-[0.03] group-hover:opacity-10 rounded-bl-[100px] transition-opacity duration-500 pointer-events-none`}></div>

                            <div className="h-14 flex items-center mb-6">
                                <img src={company.logo} alt={company.name} className="max-h-12 max-w-full object-contain filter drop-shadow-sm dark:brightness-200 dark:contrast-200" style={{ filter: company.id === 'apple' ? 'invert(1)' : 'none' }} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {company.name}
                            </h3>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {company.tags.map(tag => (
                                    <span key={tag} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between mt-auto">
                                <span className={`text-xs font-bold uppercase tracking-wider ${company.type === 'Product' ? 'text-indigo-500' : 'text-emerald-500'}`}>
                                    {company.type} Based
                                </span>
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white text-indigo-500 transition-colors">
                                    <PlayCircle className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCompanies.length === 0 && (
                    <div className="text-center py-20">
                        <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No companies found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search terms.</p>
                    </div>
                )}
            </div>

            {/* Mock Setup Modal */}
            {selectedCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden scale-in animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className={`h-2 w-full bg-gradient-to-r ${selectedCompany.color}`}></div>
                        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 inline-block mb-4 shadow-sm">
                                    <img src={selectedCompany.logo} alt={selectedCompany.name} className="h-8 object-contain" style={{ filter: selectedCompany.id === 'apple' ? 'invert(1)' : 'none' }} />
                                </div>
                                <button
                                    onClick={() => setSelectedCompany(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition"
                                >
                                    ✕
                                </button>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Mock Interview with {selectedCompany.name}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                                Our AI will simulate {selectedCompany.name}'s specific interview format, evaluating you precisely on their known scoring rubrics.
                            </p>
                        </div>

                        {/* Body */}
                        <div className="p-8">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                                Target Role
                            </label>
                            <input
                                type="text"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-gray-900 dark:text-white font-medium text-lg shadow-sm transition-all"
                                placeholder="e.g. Frontend Engineer, Product Manager"
                            />

                            <div className="mt-8 flex gap-4">
                                <div className="flex-1 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold mb-1">
                                        <Zap className="w-4 h-4" /> AI Audio/Video
                                    </div>
                                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium">Full lifelike interview</p>
                                </div>
                                <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold mb-1">
                                        <Trophy className="w-4 h-4 text-gray-400" /> Rubric Based
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">Scored like the real thing</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedCompany(null)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartMock}
                                disabled={isStarting}
                                className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-3 min-w-[160px]"
                            >
                                {isStarting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Starting...
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="w-5 h-5" /> Let's Go
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
