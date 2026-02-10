'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronRight, Sparkles, Building2, Check, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface JobRole {
    id: string;
    title: string;
    category: string;
}

// Categories for grouping job roles
const ROLE_CATEGORIES = ['Engineering', 'Data', 'Design', 'Product', 'Marketing', 'Operations', 'Security'];

export default function OnboardingPage() {
    const router = useRouter();
    const { user, updateTargetJobRole, isLoading } = useAuthStore();
    const [step, setStep] = useState(1); // 1: Job role, 2: Institution
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);

    const [formData, setFormData] = useState({
        targetJobRoleId: '',
        institutionId: '',
    });

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        // If user already has these fields, redirect to dashboard
        if (user.targetJobRoleId && user.institutionId) {
            router.push('/dashboard');
        }

        // Pre-fill if available
        setFormData({
            targetJobRoleId: user.targetJobRoleId || '',
            institutionId: user.institutionId || '',
        });

        // Skip step 1 if job role is already set
        if (user.targetJobRoleId) {
            setStep(2);
        }

    }, [user, router]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, instRes] = await Promise.all([
                    fetch(`${API_URL}/job-roles`),
                    fetch(`${API_URL}/institutions`)
                ]);

                if (rolesRes.ok) {
                    const data = await rolesRes.json();
                    setJobRoles(data.data || []);
                }

                if (instRes.ok) {
                    const data = await instRes.json();
                    setInstitutions(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch onboarding data', err);
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchData();
    }, []);

    const handleJobRoleComplete = async () => {
        if (!formData.targetJobRoleId) return;

        // Update job role immediately
        const success = await updateTargetJobRole(formData.targetJobRoleId);
        if (success) {
            setStep(2);
        }
    };

    const handleInstitutionComplete = async () => {
        // We need a new action in auth store to update institution
        // For now, let's assume updateProfile or similar endpoint can handle this
        // But since we don't have updateInstitution in store yet, we'll fetch directly

        try {
            const token = useAuthStore.getState().accessToken;
            if (!token) return;

            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ institutionId: formData.institutionId || null })
            });

            if (res.ok) {
                // Refresh user data (or update local state manually if we had the setter)
                // Re-fetching user profile would be ideal but we can just redirect
                // Ideally auth store should have a refreshUser method
                // Assuming login refreshes or we just push to dashboard
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Failed to update institution', error);
        }
    };

    const handleSkipInstitution = async () => {
        setFormData({ ...formData, institutionId: '' });
        // Send empty/null to backend
        try {
            const token = useAuthStore.getState().accessToken;
            if (!token) return;

            await fetch(`${API_URL}/users/me/institution`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ institutionId: null })
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to update institution', error);
        }
    }

    // Group job roles
    const groupedRoles = ROLE_CATEGORIES.map(cat => ({
        category: cat,
        roles: jobRoles.filter(r => r.category === cat),
    })).filter(g => g.roles.length > 0);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-grid">
            {/* Background Glow */}
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Progress */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[1, 2].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                                : 'bg-white/10 text-gray-500'
                                }`}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-indigo-500' : 'bg-white/10'}`} />}
                        </div>
                    ))}
                </div>

                <motion.div className="p-8 rounded-2xl glass-premium" layout>
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-white">Select Your Goal</h1>
                                        <p className="text-sm text-gray-400">What's your target role?</p>
                                    </div>
                                </div>

                                <div className="my-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-gray-300">
                                        We personalize your dashboard based on this.
                                    </p>
                                </div>

                                <div className="max-h-64 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                                    {loadingRoles ? (
                                        <div className="text-center py-8 text-gray-400">Loading roles...</div>
                                    ) : (
                                        groupedRoles.map((group) => (
                                            <div key={group.category}>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.category}</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {group.roles.map((role) => (
                                                        <button
                                                            key={role.id}
                                                            onClick={() => setFormData({ ...formData, targetJobRoleId: role.id })}
                                                            className={`p-3 rounded-lg text-left text-sm font-medium transition-all ${formData.targetJobRoleId === role.id
                                                                ? 'bg-indigo-500/20 border border-indigo-500/50 text-white'
                                                                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {role.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={handleJobRoleComplete}
                                    disabled={isLoading || !formData.targetJobRoleId}
                                    className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue <ChevronRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-white">Select Institution</h1>
                                        <p className="text-sm text-gray-400">Are you currently a student?</p>
                                    </div>
                                </div>

                                <div className="mb-6 mt-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                                    <select
                                        value={formData.institutionId}
                                        onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="" className="bg-gray-900">Select an Institution (Optional)</option>
                                        {institutions.map((inst) => (
                                            <option key={inst.id} value={inst.id} className="bg-gray-900">
                                                {inst.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleInstitutionComplete}
                                        disabled={isLoading}
                                        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {formData.institutionId ? 'Confirm & Finish' : 'Skip / Not a Student'} <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
