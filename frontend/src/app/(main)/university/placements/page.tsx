// src/app/(main)/university/placements/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Briefcase, Search, Loader2, Download, Filter, Building, Calendar, CheckCircle, Clock, MapPin, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell
} from 'recharts';

interface PlacementOffer {
    id: string;
    studentId: string;
    studentName: string;
    department: string;
    company: string;
    role: string;
    package: number; // in LPA (Lakhs Per Annum)
    location: string;
    date: string;
    status: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

export default function PlacementsPage() {
    const { user } = useAuthStore();
    const [offers, setOffers] = useState<PlacementOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterCompany, setFilterCompany] = useState<string>('ALL');

    // Stats
    const [stats, setStats] = useState({
        totalOffers: 0,
        highestPackage: 0,
        averagePackage: 0,
        topCompanies: [] as any[]
    });

    useEffect(() => {
        if (user) {
            loadPlacements();
        }
    }, [user]);

    const loadPlacements = async () => {
        setLoading(true);
        try {
            // Simulated fetch for placements
            const res = await authFetch('/university/placements');
            if (res.ok) {
                const data = await res.json();
                setOffers(data.data || []);
            } else {
                // Mock data
                const mockOffers: PlacementOffer[] = [
                    { id: '1', studentId: 'CS2024001', studentName: 'Alice Smith', department: 'Computer Science', company: 'Google', role: 'Software Engineer', package: 32, location: 'Bangalore', date: '2024-03-15', status: 'ACCEPTED' },
                    { id: '2', studentId: 'EE2024112', studentName: 'Charlie Davis', department: 'Electrical', company: 'Texas Instruments', role: 'Hardware Engineer', package: 24, location: 'Hyderabad', date: '2024-03-20', status: 'PENDING' },
                    { id: '3', studentId: 'CS2024015', studentName: 'Edward Brown', department: 'Computer Science', company: 'Amazon', role: 'SDE-1', package: 28, location: 'Bangalore', date: '2024-03-18', status: 'ACCEPTED' },
                    { id: '4', studentId: 'ME2024045', studentName: 'Bob Johnson', department: 'Mechanical', company: 'Tata Motors', role: 'Design Engineer', package: 12, location: 'Pune', date: '2024-04-02', status: 'ACCEPTED' },
                    { id: '5', studentId: 'CS2024088', studentName: 'Diana Evans', department: 'Computer Science', company: 'Microsoft', role: 'Program Manager', package: 26, location: 'Noida', date: '2024-04-10', status: 'PENDING' },
                    { id: '6', studentId: 'IN2024023', studentName: 'Fiona Garcia', department: 'Information Tech', company: 'Atlassian', role: 'Frontend Engineer', package: 36, location: 'Remote', date: '2024-02-28', status: 'ACCEPTED' },
                    { id: '7', studentId: 'CS2024102', studentName: 'George Harris', department: 'Computer Science', company: 'Amazon', role: 'Cloud Support', package: 18, location: 'Hyderabad', date: '2024-04-05', status: 'REJECTED' },
                ];

                setOffers(mockOffers);

                // Calculate mock stats
                const accepted = mockOffers.filter(o => o.status === 'ACCEPTED');
                const avg = accepted.length > 0 ? accepted.reduce((sum, o) => sum + o.package, 0) / accepted.length : 0;
                const highest = Math.max(...mockOffers.map(o => o.package));

                // Group by company for chart
                const companyMap: Record<string, number> = {};
                mockOffers.forEach(o => {
                    companyMap[o.company] = (companyMap[o.company] || 0) + 1;
                });

                const topComps = Object.entries(companyMap)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setStats({
                    totalOffers: mockOffers.length,
                    highestPackage: highest,
                    averagePackage: Number(avg.toFixed(1)),
                    topCompanies: topComps
                });
            }
        } catch (err) {
            console.error('Failed to fetch placements', err);
        } finally {
            setLoading(false);
        }
    };

    const companies = Array.from(new Set(offers.map(s => s.company)));

    const filteredOffers = offers.filter(offer => {
        const matchesSearch = offer.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || offer.status === filterStatus;
        const matchesCompany = filterCompany === 'ALL' || offer.company === filterCompany;

        return matchesSearch && matchesStatus && matchesCompany;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACCEPTED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30"><CheckCircle className="w-3 h-3" /> Accepted</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/30"><Clock className="w-3 h-3" /> Pending</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-500/30">Rejected</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        Placement Tracking
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor job offers, salaries, and recruiting company trends.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <Download className="w-4 h-4" />
                        Export Placement Report
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl glass border border-gray-200 dark:border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Offers</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalOffers}</p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl glass border border-gray-200 dark:border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <span className="font-black text-xl">₹</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Highest Package</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.highestPackage} <span className="text-sm font-medium text-gray-500">LPA</span></p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl glass border border-gray-200 dark:border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <BarChart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Average Package</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.averagePackage} <span className="text-sm font-medium text-gray-500">LPA</span></p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: List and Filters */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filters */}
                    <div className="p-4 rounded-2xl glass border border-gray-200 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search student or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-1/2 md:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 outline-none text-gray-700 dark:text-gray-300 font-medium"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACCEPTED">Accepted</option>
                                <option value="PENDING">Pending</option>
                                <option value="REJECTED">Rejected</option>
                            </select>

                            <select
                                value={filterCompany}
                                onChange={(e) => setFilterCompany(e.target.value)}
                                className="w-1/2 md:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-violet-500 outline-none text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap"
                            >
                                <option value="ALL">All Companies</option>
                                {companies.map(comp => (
                                    <option key={comp} value={comp}>{comp}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Offers List */}
                    {loading ? (
                        <div className="flex justify-center p-12 glass rounded-2xl border border-gray-200 dark:border-white/5">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-gray-200 dark:border-white/5 glass overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-white/5">
                                            <th className="px-5 py-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                            <th className="px-5 py-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Offer Details</th>
                                            <th className="px-5 py-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Package</th>
                                            <th className="px-5 py-3 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                        <AnimatePresence>
                                            {filteredOffers.map((offer, idx) => (
                                                <motion.tr
                                                    key={offer.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-gray-900 dark:text-white">{offer.studentName}</div>
                                                        <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-0.5">
                                                            <span>{offer.studentId}</span>
                                                            <span className="text-gray-400">{offer.department}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-1">
                                                            <Building className="w-4 h-4 text-gray-400" />
                                                            {offer.company}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{offer.role}</div>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                            <MapPin className="w-3 h-3" /> {offer.location}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="text-lg font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 inline-block px-2.5 py-1 rounded-lg border border-violet-100 dark:border-violet-500/20">
                                                            {offer.package} <span className="text-[10px] font-bold uppercase text-violet-500">LPA</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col items-start gap-2">
                                                            {getStatusBadge(offer.status)}
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                                <Calendar className="w-3 h-3" /> {new Date(offer.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                            {filteredOffers.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                        No placement offers match your filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Analytics Snippets */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-2xl glass border border-gray-200 dark:border-white/5"
                    >
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Building className="w-4 h-4 text-violet-500" />
                            Top Recruiting Companies
                        </h3>

                        {!loading && stats.topCompanies.length > 0 ? (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.topCompanies} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:opacity-10" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} width={80} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl">
                                                            <p className="font-bold text-gray-900 dark:text-white">{payload[0].payload.name}</p>
                                                            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{payload[0].value} Offers</p>
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                            {stats.topCompanies.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
                        )}
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
