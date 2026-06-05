'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, EyeOff, Mail, Lock, User, ArrowRight, Check,
    ChevronRight, Target, Zap, Trophy, Users,
    GraduationCap, Building2, ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { GoogleLogin } from '@react-oauth/google';
import { authFetch } from '@/lib/auth-fetch';
import { fetchJobRoles, type JobRole } from '@/lib/job-roles';
import Logo from '@/components/layout/Logo';

const ROLE_CATEGORIES = ['Engineering', 'Data', 'Design', 'Product', 'Management', 'Marketing', 'Operations'];

const ROLE_CATEGORY_ICONS: Record<string, string> = {
    Engineering: '⚙️',
    Data: '📊',
    Design: '🎨',
    Product: '🚀',
    Management: '📋',
    Marketing: '📣',
    Operations: '🔧',
};

const VALUE_PROPS = [
    { icon: Target, label: 'AI-powered ATS resume scoring', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Zap, label: 'Real-time mock interview feedback', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Trophy, label: 'Skill badges employers trust', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { icon: Users, label: 'Built for students, by placement experts', color: 'text-green-400', bg: 'bg-green-500/10' },
];

function PasswordStrengthMeter({ password }: { password: string }) {
    const checks = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(password) },
        { label: 'One number', met: /[0-9]/.test(password) },
    ];
    const score = checks.filter(c => c.met).length;
    const barColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

    if (!password) return null;

    return (
        <div className="mt-3 space-y-2.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? barColors[score - 1] : 'bg-gray-200 dark:bg-white/10'}`}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${c.met ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                            {c.met && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <span className={`text-xs transition-colors ${c.met ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{c.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const inputClass = "w-full py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";

export default function RegisterPage() {
    const router = useRouter();
    const { register, googleLogin, isLoading, error } = useAuthStore();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
    const [activeCategory, setActiveCategory] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        targetJobRoleId: '',
        institutionId: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roles, instRes] = await Promise.all([
                    fetchJobRoles((url, opts) => authFetch(url, { ...opts, skipAuth: true })),
                    authFetch(`/institutions`, { skipAuth: true }),
                ]);
                setJobRoles(roles);
                if (instRes.ok) {
                    const data = await instRes.json();
                    setInstitutions(data.data || []);
                }
            } catch { /* silent */ } finally {
                setLoadingRoles(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (jobRoles.length > 0 && !activeCategory) {
            const first = ROLE_CATEGORIES.find(cat => jobRoles.some(r => r.category === cat));
            if (first) setActiveCategory(first);
        }
    }, [jobRoles, activeCategory]);

    const handleCompleteRegistration = async (skipInstitution = false) => {
        const success = await register(
            formData.email,
            formData.password,
            formData.name,
            formData.targetJobRoleId || undefined,
            skipInstitution ? undefined : (formData.institutionId || undefined),
        );
        if (success) router.push('/dashboard');
    };

    const passwordChecks = [
        formData.password.length >= 8,
        /[A-Z]/.test(formData.password),
        /[a-z]/.test(formData.password),
        /[0-9]/.test(formData.password),
    ];
    const isStep1Valid = formData.email && formData.password && passwordChecks.every(Boolean);

    const groupedRoles = ROLE_CATEGORIES
        .map(cat => ({ category: cat, roles: jobRoles.filter(r => r.category === cat) }))
        .filter(g => g.roles.length > 0);

    const visibleRoles = jobRoles.filter(r => r.category === activeCategory);

    const stepLabels = ['Account', 'Target Role', 'Institution'];

    return (
        <div className="min-h-screen flex">
            {/* ── LEFT BRAND PANEL ── */}
            <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col bg-[#04091A] overflow-hidden">
                <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-blue-700/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full px-12 py-10">
                    <Logo width={180} height={60} variant="dark" />

                    <div className="flex-1 flex flex-col justify-center">
                        <h2 className="text-3xl xl:text-[2.4rem] font-bold text-white leading-tight mb-3">
                            Launch your career<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                with AI precision.
                            </span>
                        </h2>
                        <p className="text-gray-400 text-[0.9rem] leading-relaxed mb-10 max-w-[280px]">
                            PlaceNxt prepares you for the job market with real AI tools — not just another learning platform.
                        </p>

                        <div className="space-y-4">
                            {VALUE_PROPS.map(({ icon: Icon, label, color, bg }) => (
                                <div key={label} className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl ${bg} border border-white/8 flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <span className="text-gray-300 text-sm font-medium">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                R
                            </div>
                            <div className="min-w-0">
                                <p className="text-white text-sm font-semibold">Rahul Menon</p>
                                <p className="text-gray-500 text-xs">SWE @ Google · BITS Pilani '24</p>
                            </div>
                            <div className="ml-auto flex gap-0.5 flex-shrink-0">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-300 text-[0.82rem] leading-relaxed italic">
                            "PlaceNxt's ATS scoring helped me rewrite my resume from scratch. Got 3 interview calls in the first week."
                        </p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-[#F7F9FC] dark:bg-[#060D1E] overflow-y-auto">
                {/* Back link */}
                <div className="w-full max-w-[420px] mb-5">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>
                </div>

                {/* Mobile logo */}
                <div className="lg:hidden mb-6">
                    <Logo width={160} height={54} />
                </div>

                {/* Step tracker */}
                <div className="w-full max-w-[420px] mb-7">
                    <div className="flex items-start">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step > s
                                        ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                                        : step === s
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                                            : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                                        }`}>
                                        {step > s ? <Check className="w-4 h-4" /> : s}
                                    </div>
                                    <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${step >= s ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                        {stepLabels[s - 1]}
                                    </span>
                                </div>
                                {s < 3 && (
                                    <div className={`h-px flex-1 mx-3 mb-4 transition-all duration-500 ${step > s ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card */}
                <motion.div className="w-full max-w-[420px] rounded-2xl glass-premium shadow-xl" layout>
                    <AnimatePresence mode="wait">

                        {/* ── STEP 1: Account ── */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="p-8"
                            >
                                <h1 className="text-[1.5rem] font-bold text-gray-900 dark:text-white mb-1">Create your account</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">
                                    Your AI-powered launchpad to land your first great job
                                </p>

                                {error && (
                                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                                        <span className="mt-0.5 leading-none">⚠</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                                    <div>
                                        <label className="block text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={`${inputClass} pl-9 pr-4`}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={`${inputClass} pl-9 pr-4`}
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className={`${inputClass} pl-9 pr-11`}
                                                placeholder="Min. 8 characters"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <PasswordStrengthMeter password={formData.password} />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!isStep1Valid}
                                        className="w-full mt-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                    >
                                        Continue <ChevronRight className="w-4 h-4" />
                                    </button>
                                </form>

                                <div className="flex items-center gap-3 my-5">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
                                    <span className="text-xs text-gray-400 font-medium px-1">or</span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
                                </div>

                                <div className="flex justify-center">
                                    {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                                        <GoogleLogin
                                            onSuccess={async (credentialResponse) => {
                                                if (credentialResponse.credential) {
                                                    const success = await googleLogin(credentialResponse.credential);
                                                    if (success) {
                                                        const user = useAuthStore.getState().user;
                                                        router.push(user?.targetJobRoleId ? '/dashboard' : '/onboarding');
                                                    }
                                                }
                                            }}
                                            onError={() => console.error('Google Login Failed')}
                                            theme="filled_black"
                                            shape="pill"
                                        />
                                    ) : null}
                                </div>

                                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-semibold transition-colors">
                                        Sign in
                                    </Link>
                                </p>
                            </motion.div>
                        )}

                        {/* ── STEP 2: Target Role ── */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="p-8"
                            >
                                <h1 className="text-[1.5rem] font-bold text-gray-900 dark:text-white mb-1">Pick your target role</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                                    We'll personalize your skill tests and interview prep
                                </p>

                                {/* Category pills */}
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-1 px-1">
                                    {groupedRoles.map(({ category }) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setActiveCategory(category)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === category
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                                : 'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/12'
                                                }`}
                                        >
                                            {ROLE_CATEGORY_ICONS[category]} {category}
                                        </button>
                                    ))}
                                </div>

                                {/* Role grid */}
                                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 mb-5">
                                    {loadingRoles ? (
                                        <div className="col-span-2 text-center py-8 text-sm text-gray-400">Loading roles…</div>
                                    ) : (
                                        visibleRoles.map((role) => {
                                            const selected = formData.targetJobRoleId === role.id;
                                            return (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, targetJobRoleId: role.id })}
                                                    className={`relative p-3 rounded-xl text-left text-sm font-medium transition-all border ${selected
                                                        ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300'
                                                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/40 dark:hover:bg-blue-500/5'
                                                        }`}
                                                >
                                                    {selected && (
                                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    )}
                                                    {role.title}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={isLoading || !formData.targetJobRoleId}
                                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                    >
                                        Continue <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        Skip for now
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 3: Institution ── */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="p-8"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-5">
                                    <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h1 className="text-[1.5rem] font-bold text-gray-900 dark:text-white mb-1">Are you a student?</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Linking your institution unlocks campus placement tracking and institution-specific features.
                                </p>

                                <div className="mb-6">
                                    <label className="block text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                        Institution
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <select
                                            value={formData.institutionId}
                                            onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                            className={`${inputClass} pl-9 pr-9 appearance-none cursor-pointer`}
                                        >
                                            <option value="" className="bg-white dark:bg-gray-900">Select your institution…</option>
                                            {institutions.map((inst) => (
                                                <option key={inst.id} value={inst.id} className="bg-white dark:bg-gray-900">
                                                    {inst.name}
                                                </option>
                                            ))}
                                            <option value="other" className="bg-white dark:bg-gray-900">Other</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCompleteRegistration(false)}
                                        disabled={isLoading || !formData.institutionId}
                                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Create Account <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCompleteRegistration(true)}
                                        disabled={isLoading}
                                        className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                                    >
                                        Skip / Not a Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </motion.div>

                <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
                    By creating an account you agree to our{' '}
                    <Link href="/terms" className="text-blue-500 hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>.
                </p>
            </div>
        </div>
    );
}
