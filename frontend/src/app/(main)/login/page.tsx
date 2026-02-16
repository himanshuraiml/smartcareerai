'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const router = useRouter();
    const { login, googleLogin, isLoading, error } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(formData.email, formData.password);
        if (success) {
            // Check user role and redirect accordingly
            const user = useAuthStore.getState().user;
            if (user?.role === 'ADMIN') {
                router.push('/admin');
            } else if (user?.role === 'RECRUITER') {
                router.push('/recruiter');
            } else if (user?.role === 'INSTITUTION_ADMIN') {
                router.push('/institution-admin');
            } else {
                router.push('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
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
                        <span className="text-2xl font-bold gradient-text">PlaceNxt</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="p-8 rounded-2xl glass">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h1>
                    <p className="text-gray-400 text-center mb-8">Sign in to continue your journey</p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500" />
                                <span className="text-sm text-gray-400">Remember me</span>
                            </label>
                            <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 border-t border-white/10"></div>
                        <span className="text-sm text-gray-500">Or continue with</span>
                        <div className="flex-1 border-t border-white/10"></div>
                    </div>

                    <div className="flex justify-center w-full">
                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        const success = await googleLogin(credentialResponse.credential);
                                        if (success) {
                                            const user = useAuthStore.getState().user;
                                            if (user?.role === 'ADMIN') {
                                                router.push('/admin');
                                            } else if (user?.role === 'RECRUITER') {
                                                router.push('/recruiter');
                                            } else if (user?.role === 'INSTITUTION_ADMIN') {
                                                router.push('/institution-admin');
                                            } else {
                                                // Check if onboarding is complete
                                                if (!user?.targetJobRoleId) {
                                                    router.push('/onboarding');
                                                } else {
                                                    router.push('/dashboard');
                                                }
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

                    <p className="mt-8 text-center text-gray-400">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}


