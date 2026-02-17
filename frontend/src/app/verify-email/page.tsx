'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { authFetch } from "@/lib/auth-fetch";
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Token is missing.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await authFetch(`/auth/verify-email/${token}`, { skipAuth: true });
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now access all features and free credits.');
                } else {
                    setStatus('error');
                    setMessage(data.error?.message || 'Verification failed. The link might be expired or invalid.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Network error. Please try again later.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0f23]">
            <div className="w-full max-w-md">
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
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">PlaceNxt</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                        {status === 'loading' && (
                            <>
                                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
                                <p className="text-gray-400">{message}</p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Verified!</h1>
                                <p className="text-gray-400 mb-8">{message}</p>
                                <Link
                                    href="/dashboard"
                                    className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                                </Link>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
                                <p className="text-gray-400 mb-8">{message}</p>
                                <Link
                                    href="/login"
                                    className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    Back to Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0f23] text-white">
                Loading...
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
