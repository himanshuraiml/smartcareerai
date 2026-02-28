'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, Briefcase, ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { GoogleLogin } from '@react-oauth/google';
import { authFetch } from '@/lib/auth-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface JobRole {
    id: string;
    title: string;
    category: string;
}

// Categories for grouping job roles
const ROLE_CATEGORIES = ['Engineering', 'Data', 'Design', 'Product', 'Marketing', 'Operations'];

export default function RegisterPage() {
    const router = useRouter();
    const { register, googleLogin, isLoading, error } = useAuthStore();
    const [step, setStep] = useState(1); // 1: Basic info, 2: Job role selection, 3: Institution
    const [showPassword, setShowPassword] = useState(false);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);

    // Add institutionId to formData
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        targetJobRoleId: '',
        institutionId: '',
    });

    // Fetch job roles and institutions on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, instRes] = await Promise.all([
                    authFetch(`/job-roles`, { skipAuth: true }),
                    authFetch(`/institutions`, { skipAuth: true })
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
                // Failed to fetch data - using defaults
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
            return;
        }
        if (step === 2) {
            setStep(3);
            return;
        }

        const success = await register(
            formData.email,
            formData.password,
            formData.name,
            formData.targetJobRoleId || undefined,
            formData.institutionId || undefined
        );
        if (success) {
            router.push('/dashboard');
        }
    };

    const handleSkipJobRole = () => {
        setStep(3);
    };

    const handleSkipInstitution = async () => {
        const success = await register(
            formData.email,
            formData.password,
            formData.name,
            formData.targetJobRoleId || undefined
        );
        if (success) {
            router.push('/dashboard');
        }
    }

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(formData.password) },
        { label: 'One number', met: /[0-9]/.test(formData.password) },
    ];

    const isStep1Valid = formData.email && formData.password && passwordRequirements.every(r => r.met);

    // Group job roles by category
    const groupedRoles = ROLE_CATEGORIES.map(cat => ({
        category: cat,
        roles: jobRoles.filter(r => r.category === cat),
    })).filter(g => g.roles.length > 0);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-grid">
            {/* Background Glow */}
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/logo-new-light.png"
                            alt="PlaceNxt Logo"
                            width={320}
                            height={80}
                            className="h-20 w-auto mx-auto block dark:hidden"
                            priority
                        />
                        <Image
                            src="/logo-new-dark.png"
                            alt="PlaceNxt Logo"
                            width={320}
                            height={80}
                            className="h-20 w-auto mx-auto hidden dark:block"
                            priority
                        />
                    </Link>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                                : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                                }`}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-white/10'}`} />}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <motion.div
                    className="p-8 rounded-2xl glass-premium"
                    layout
                >
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Create Account</h1>
                                <p className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-center mb-8">Start your AI-powered career journey</p>

                                {error && (
                                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-600 dark:text-gray-300 mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-600 dark:text-gray-300 mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-600 dark:text-gray-300 mb-2">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-10 pr-12 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-700 dark:hover:text-gray-600 dark:text-gray-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Password requirements */}
                                        <div className="mt-3 space-y-1">
                                            {passwordRequirements.map((req, index) => (
                                                <div key={index} className="flex items-center gap-2 text-xs">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500/20' : 'bg-gray-200 dark:bg-white/5'}`}>
                                                        {req.met && <Check className="w-3 h-3 text-green-400" />}
                                                    </div>
                                                    <span className={req.met ? 'text-green-400' : 'text-gray-500'}>{req.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!isStep1Valid}
                                        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </button>
                                </form>

                                <div className="flex items-center gap-4 my-6">
                                    <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
                                    <span className="text-sm text-gray-500">Or sign up with</span>
                                    <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
                                </div>

                                <div className="flex justify-center w-full">
                                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                                        <GoogleLogin
                                            onSuccess={async (credentialResponse) => {
                                                if (credentialResponse.credential) {
                                                    const success = await googleLogin(credentialResponse.credential);
                                                    if (success) {
                                                        // Check if user has completed onboarding
                                                        const user = useAuthStore.getState().user;
                                                        if (!user?.targetJobRoleId) {
                                                            router.push('/onboarding');
                                                        } else {
                                                            router.push('/dashboard');
                                                        }
                                                    }
                                                }
                                            }}
                                            onError={() => {
                                                console.error('Google Login Failed');
                                            }}
                                            theme="filled_black"
                                            shape="pill"
                                        />
                                    ) : null}
                                </div>
                            </motion.div>
                        ) : step === 2 ? (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">What's your target role?</h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">We'll personalize your experience</p>
                                    </div>
                                </div>

                                {/* Tip */}
                                <div className="my-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                        This helps us curate skill tests, interview prep, and job recommendations for you.
                                    </p>
                                </div>

                                {/* Job Role Selection */}
                                <div className="max-h-64 overflow-y-auto space-y-4 mb-6 pr-2">
                                    {loadingRoles ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading roles...</div>
                                    ) : (
                                        groupedRoles.map((group) => (
                                            <div key={group.category}>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{group.category}</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {group.roles.map((role) => (
                                                        <button
                                                            key={role.id}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, targetJobRoleId: role.id })}
                                                            className={`p-3 rounded-lg text-left text-sm font-medium transition-all ${formData.targetJobRoleId === role.id
                                                                ? 'bg-indigo-500/20 border border-indigo-500/50 text-white'
                                                                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
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

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading || !formData.targetJobRoleId}
                                        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSkipJobRole}
                                        disabled={isLoading}
                                        className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
                                    >
                                        Skip for now
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-600 dark:text-gray-300 text-sm transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Select Institution</h1>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Are you a student?</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Institution</label>
                                    <select
                                        value={formData.institutionId}
                                        onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    >
                                        <option value="" className="bg-white dark:bg-gray-900">Select an Institution</option>
                                        {institutions.map((inst) => (
                                            <option key={inst.id} value={inst.id} className="bg-white dark:bg-gray-900">
                                                {inst.name}
                                            </option>
                                        ))}
                                        <option value="other" className="bg-white dark:bg-gray-900">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isLoading || !formData.institutionId}
                                        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Create Account <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSkipInstitution}
                                        disabled={isLoading}
                                        className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
                                    >
                                        Skip / Not a Student
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-600 dark:text-gray-300 text-sm transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}


