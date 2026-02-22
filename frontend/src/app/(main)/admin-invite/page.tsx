'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Check, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function AdminInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { login } = useAuthStore();

    const [step, setStep] = useState<'loading' | 'invalid' | 'form' | 'success'>('loading');
    const [userEmail, setUserEmail] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const passwordRequirements = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'One lowercase letter', met: /[a-z]/.test(password) },
        { label: 'One number', met: /[0-9]/.test(password) },
    ];

    const isPasswordValid = passwordRequirements.every(r => r.met);
    const passwordsMatch = password === confirmPassword && password.length > 0;

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStep('invalid');
                return;
            }

            try {
                const res = await authFetch(`/auth/verify-invite?token=${token}`, { skipAuth: true });
                const data = await res.json();

                if (res.ok && data.valid) {
                    setUserEmail(data.email || '');
                    setInstitutionName(data.institutionName || '');
                    setStep('form');
                } else {
                    setStep('invalid');
                }
            } catch (err) {
                console.error('Token verification failed:', err);
                setStep('invalid');
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isPasswordValid) {
            setError('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        setSubmitting(true);

        try {
            const res = await authFetch(`/auth/accept-invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
                skipAuth: true
            });

            const data = await res.json();

            if (res.ok) {
                setStep('success');
                // Auto login after 2 seconds
                setTimeout(async () => {
                    const success = await login(userEmail, password);
                    if (success) {
                        router.push('/institution-admin');
                    }
                }, 2000);
            } else {
                setError(data.message || 'Failed to set password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Verifying your invitation...</p>
                </div>
            </div>
        );
    }

    if (step === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid or Expired Link</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Activated!</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Your password has been set successfully. Redirecting to your dashboard...
                    </p>
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-grid px-4 py-12">
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <Image
                            src="/logo.svg"
                            alt="PlaceNxt Logo"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-xl"
                        />
                        <span className="text-2xl font-bold gradient-text">PlaceNxt</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 border border-gray-200 dark:border-white/10">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            You&apos;ve been invited as admin for{' '}
                            <span className="text-indigo-400 font-medium">{institutionName}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={userEmail}
                                readOnly
                                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Set Your Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter your new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-600 dark:text-gray-300"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-600 dark:text-gray-300"
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !isPasswordValid || !passwordsMatch}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Activate Account'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function AdminInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-grid">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <AdminInviteContent />
        </Suspense>
    );
}


