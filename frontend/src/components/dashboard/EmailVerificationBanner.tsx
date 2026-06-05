'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, 
    Gift, 
    Sparkles, 
    RotateCw, 
    Send, 
    Loader2, 
    CheckCircle, 
    FileText, 
    Video, 
    FileQuestion
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from '@/hooks/use-toast';

export default function EmailVerificationBanner() {
    const { user, fetchUser } = useAuthStore();
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    // If user is not logged in or already verified, don't show the banner
    if (!user || user.isVerified) return null;

    const handleResendVerification = async () => {
        if (!user.email) return;
        setIsResending(true);
        setResendSuccess(false);
        try {
            const res = await authFetch('/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
            });
            const data = await res.json();

            if (res.ok) {
                setResendSuccess(true);
                toast({
                    title: "Verification Email Sent",
                    description: "Please check your inbox and spam folder for the verification link.",
                });
                // Reset success checkmark after 4 seconds
                setTimeout(() => setResendSuccess(false), 4000);
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Failed to send verification email.",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleCheckStatus = async () => {
        setIsChecking(true);
        try {
            await fetchUser();
            toast({
                title: "Status Checked",
                description: "Your verification status has been updated.",
            });
        } catch (error) {
            toast({
                title: "Verification Check Failed",
                description: "Could not fetch updated status. Please try refreshing.",
            });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="relative z-30 w-full mb-6"
            >
                {/* Glow Backdrop */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 blur-xl rounded-2xl opacity-70 pointer-events-none" />

                {/* Main Card */}
                <div className="relative overflow-hidden rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-white/70 dark:bg-gray-950/70 backdrop-blur-md shadow-xl dark:shadow-indigo-950/10 p-5 md:p-6">
                    {/* Visual Border Spark Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        
                        {/* Information Section */}
                        <div className="flex items-start gap-4 max-w-2xl">
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Mail className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-950">
                                    !
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                        Verify Your Email Address
                                    </h3>
                                    <span className="text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100/50 dark:border-indigo-500/10">
                                        {user.email}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Please confirm your email to activate your account. Once verified, your free tier benefits will be instantly credited to your dashboard.
                                </p>
                            </div>
                        </div>

                        {/* Unlocked Rewards Showcase */}
                        <div className="flex flex-col gap-2 bg-gray-50/55 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl p-3 md:p-4 min-w-[280px]">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                                <Gift className="w-4 h-4" />
                                <span>Unlocks Free Tier Perks</span>
                                <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {/* Resume Review perk */}
                                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/10">
                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                                    <span className="text-xs font-black text-blue-700 dark:text-blue-300">3</span>
                                    <span className="text-[9px] text-blue-500/80 dark:text-blue-400/80 font-medium">Resumes</span>
                                </div>

                                {/* Mock Interview perk */}
                                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/10">
                                    <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">1</span>
                                    <span className="text-[9px] text-emerald-500/80 dark:text-emerald-400/80 font-medium">Interview</span>
                                </div>

                                {/* Skill Test perk */}
                                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100/50 dark:border-amber-500/10">
                                    <FileQuestion className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
                                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">3</span>
                                    <span className="text-[9px] text-amber-500/80 dark:text-amber-400/80 font-medium">Tests</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 shrink-0 sm:flex-row flex-col w-full lg:w-auto">
                            {/* Resend Verification Button */}
                            <button
                                onClick={handleResendVerification}
                                disabled={isResending || resendSuccess}
                                className={`w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    resendSuccess
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-75'
                                }`}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : resendSuccess ? (
                                    <>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Sent successfully!
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        Resend Email
                                    </>
                                )}
                            </button>

                            {/* Check Verification Status Button */}
                            <button
                                onClick={handleCheckStatus}
                                disabled={isChecking}
                                className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                <RotateCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                                Check Status
                            </button>
                        </div>
                        
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
