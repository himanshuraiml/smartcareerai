"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    Save,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Building2,
    Briefcase,
    Trophy,
    Info,
    Loader2,
    Settings,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/auth-fetch";

interface PlacementPolicy {
    dreamCompanyThreshold: number;
    maxOffersAllowed: number;
    coreCompanyBranches: string[];
    internshipConversionRules: any;
    isActive: boolean;
}

export default function PlacementPolicyPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policy, setPolicy] = useState<PlacementPolicy>({
        dreamCompanyThreshold: 10,
        maxOffersAllowed: 2,
        coreCompanyBranches: [],
        internshipConversionRules: {},
        isActive: true,
    });
    const [newBranch, setNewBranch] = useState("");

    useEffect(() => {
        fetchPolicy();
    }, []);

    const fetchPolicy = async () => {
        try {
            const response = await authFetch('/admin/institution/policy');
            const data = await response.json();
            if (data.success && data.data) {
                setPolicy(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch policy:', error);
            toast({
                title: "Error",
                description: "Failed to load placement policy",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await authFetch('/admin/institution/policy', {
                method: 'PUT',
                body: JSON.stringify(policy)
            });
            const data = await response.json();
            if (data.success) {
                toast({
                    title: "Success",
                    description: "Placement policy updated successfully",
                });
            }
        } catch (error) {
            console.error('Failed to save policy:', error);
            toast({
                title: "Error",
                description: "Failed to update placement policy",
            });
        } finally {
            setSaving(false);
        }
    };

    const addBranch = () => {
        if (newBranch && !policy.coreCompanyBranches.includes(newBranch)) {
            setPolicy({
                ...policy,
                coreCompanyBranches: [...policy.coreCompanyBranches, newBranch]
            });
            setNewBranch("");
        }
    };

    const removeBranch = (branch: string) => {
        setPolicy({
            ...policy,
            coreCompanyBranches: policy.coreCompanyBranches.filter(b => b !== branch)
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Placement Policy Engine</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Configure automated rules for eligibility, offers, and company classifications.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/institution-admin" className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Policy
                    </button>
                </div>
            </div>

            {/* Main Policy Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Core Rules */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Eligibility Rules */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/[0.08] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                            <Settings className="w-32 h-32" />
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Briefcase className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">General Eligibility</h3>
                                <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mt-0.5">Automated offer management</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    Dream Company Threshold (LPA)
                                    <Info className="w-3.5 h-3.5 text-gray-500" />
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={policy.dreamCompanyThreshold}
                                        onChange={(e) => setPolicy({ ...policy, dreamCompanyThreshold: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-lg"
                                        placeholder="10"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">LPA</div>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    Companies offering packages above this threshold will be classified as "Dream Companies" for placement priority.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                    Max Offers per Student
                                    <Info className="w-3.5 h-3.5 text-gray-500" />
                                </label>
                                <div className="">
                                    <input
                                        type="number"
                                        value={policy.maxOffersAllowed}
                                        onChange={(e) => setPolicy({ ...policy, maxOffersAllowed: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-lg"
                                        placeholder="2"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    The maximum number of job offers a student can accept before being automatically delisted from future drives.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                            <div className="mt-1 p-1 bg-indigo-500/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="text-sm text-gray-400 leading-relaxed">
                                <span className="font-bold text-indigo-400">Note:</span> Dream offers typically override the max offer rule. If a student secures a non-dream offer, they can still apply for Dream companies until they reach the dream threshold.
                            </div>
                        </div>
                    </div>

                    {/* Core Branches Configuration */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/[0.08]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Trophy className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">Core Branch Priority</h3>
                                <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mt-0.5">Sector-specific eligibility</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newBranch}
                                    onChange={(e) => setNewBranch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addBranch()}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-all"
                                    placeholder="Enter branch name (e.g. Computer Science)"
                                />
                                <button
                                    onClick={addBranch}
                                    className="px-6 py-3 rounded-xl bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                                >
                                    Add Branch
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {policy.coreCompanyBranches.length === 0 && (
                                    <div className="w-full py-8 text-center text-gray-600 border border-dashed border-white/10 rounded-2xl italic font-medium">
                                        No core branches defined yet.
                                    </div>
                                )}
                                {policy.coreCompanyBranches.map((branch, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 font-bold text-sm group">
                                        {branch}
                                        <button onClick={() => removeBranch(branch)} className="hover:text-amber-200 transition-colors opacity-0 group-hover:opacity-100">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 pt-2 border-t border-white/[0.04]">
                                Students in these branches will receive priority or exclusive access to "Core" category job drives.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Insights & Status */}
                <div className="space-y-8">
                    {/* Status Card */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <CheckCircle2 className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10 text-white">
                            <h3 className="text-xl font-black mb-1">Policy Status</h3>
                            <p className="text-indigo-100 text-sm font-medium opacity-80 mb-6">Real-time governance engine</p>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 mb-6">
                                <span className="text-sm font-bold">Automation Active</span>
                                <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${policy.isActive ? 'bg-green-400' : 'bg-white/20'}`}
                                    onClick={() => setPolicy({ ...policy, isActive: !policy.isActive })}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${policy.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                                When active, the system will automatically handle student eligibility and delisting based on current rules.
                            </p>
                        </div>
                    </div>

                    {/* Company Classification info */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/[0.08]">
                        <h4 className="text-lg font-black text-white mb-6">Company Classifications</h4>
                        <div className="space-y-5">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Trophy className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">Dream Companies</p>
                                    <p className="text-xs text-gray-500 mt-1">Offers {policy.dreamCompanyThreshold}+ LPA. One chance allowed after securing mass/core offers.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">Core Companies</p>
                                    <p className="text-xs text-gray-500 mt-1">Tier 1 sector companies. Priority given to listed core branches.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">General/Mass Recruiter</p>
                                    <p className="text-xs text-gray-500 mt-1">Standard hiring for all engineering and management students.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Help card */}
                    <div className="p-8 rounded-3xl border border-dashed border-white/10 group hover:border-indigo-500/30 transition-all cursor-help">
                        <h4 className="text-white font-bold flex items-center gap-2 mb-3">
                            Need help with rules?
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Placement policies help in maintaining discipline and ensuring fair opportunities for all students. Contact support for custom automation rules.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const X = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);
