"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Plus, Building2, Search, Filter,
    MoreVertical, Mail, Phone, Calendar,
    ArrowUpRight, Star, Globe, Download
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface Partnership {
    id: string;
    companyName: string;
    partnershipTier: string;
    mouStatus: string;
    mouExpiryDate: string | null;
    recruiterContacts: any[];
    isActive: boolean;
}

export default function CorporateCRM() {
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newPartner, setNewPartner] = useState({
        companyName: "",
        partnershipTier: "BASIC",
        mouStatus: "UNSIGNED"
    });

    useEffect(() => {
        fetchPartnerships();
    }, []);

    const fetchPartnerships = async () => {
        try {
            const res = await authFetch("/university/partnerships");
            if (res.ok) {
                const data = await res.json();
                setPartnerships(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch partnerships", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authFetch("/university/partnerships", {
                method: "POST",
                body: JSON.stringify(newPartner)
            });
            if (res.ok) {
                setIsAdding(false);
                setNewPartner({ companyName: "", partnershipTier: "BASIC", mouStatus: "UNSIGNED" });
                fetchPartnerships();
            }
        } catch (error) {
            console.error("Failed to create partnership", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Corporate Relations CRM</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage institutional partnerships, MOUs and key accounts.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-500/25 flex items-center gap-2 transition transform active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Partner
                    </button>
                    <button className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export CRM
                    </button>
                </div>
            </div>

            {/* Partner Filters */}
            <div className="flex items-center gap-4 py-4 max-w-2xl">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by company name..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500 transition shadow-sm"
                    />
                </div>
                <button className="p-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/5 rounded-2xl text-gray-500 hover:text-violet-500 transition shadow-sm">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Partners List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-gray-800 border-2 border-dashed border-violet-500/30 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center"
                        >
                            <form onSubmit={handleCreate} className="space-y-4">
                                <Building2 className="w-10 h-10 text-violet-500 mx-auto mb-2" />
                                <h3 className="text-center font-bold text-gray-900 dark:text-white">New Corporate Partner</h3>
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={newPartner.companyName}
                                    onChange={(e) => setNewPartner({ ...newPartner, companyName: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none text-sm"
                                    required
                                />
                                <select
                                    value={newPartner.partnershipTier}
                                    onChange={(e) => setNewPartner({ ...newPartner, partnershipTier: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none text-sm"
                                >
                                    <option value="BASIC">Basic Partner</option>
                                    <option value="STRATEGIC">Strategic Partner</option>
                                    <option value="PLATINUM">Platinum Tier</option>
                                </select>
                                <div className="flex gap-2 justify-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-violet-600 text-white px-6 py-2 rounded-lg text-xs font-bold"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {partnerships.map((partner, idx) => (
                    <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:shadow-2xl hover:shadow-violet-500/10 transition duration-300"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10">
                                <Building2 className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-violet-500 transition-colors" />
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                <Star className="w-3 h-3 fill-current" />
                                {partner.partnershipTier}
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-violet-500 transition-colors">{partner.companyName}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                MOU Expiry: {partner.mouExpiryDate ? new Date(partner.mouExpiryDate).toLocaleDateString() : 'Rolling'}
                            </span>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between text-xs text-gray-500 font-bold mb-3">
                                <span>RECRUITER CONTACTS</span>
                                <span className="text-violet-500">{partner.recruiterContacts.length || 0}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-gray-50 dark:bg-white/5 py-2 px-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-violet-500/50 transition flex items-center justify-center gap-2 group/btn">
                                    <Mail className="w-3.5 h-3.5 group-hover/btn:text-violet-500" />
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover/btn:text-violet-500 transition">Email Team</span>
                                </button>
                                <button className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-violet-500/10 transition group/btn">
                                    <Globe className="w-4 h-4 group-hover/btn:text-violet-500" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Empty State */}
                {!loading && partnerships.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <Building2 className="w-16 h-16 text-gray-200 dark:text-gray-800 mx-auto" />
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">No corporate partners yet</p>
                            <p className="text-sm text-gray-500">Start building your relationship network today.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
