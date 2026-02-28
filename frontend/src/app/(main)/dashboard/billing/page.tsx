"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Video, FileQuestion, ArrowRight, Wallet, History, CreditCard, Tag, Check, Loader2, AlertCircle, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import CreditBalanceCard from "@/components/billing/CreditBalanceCard";
import CreditPurchaseModal from "@/components/billing/CreditPurchaseModal";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Subscription {
    status: string;
    plan: {
        name: string;
        displayName: string;
        priceMonthly: number;
        priceYearly: number;
    };
    currentPeriodEnd: string;
}

interface Credits {
    resumeReviews: number;
    interviews: number;
    skillTests: number;
}

interface Transaction {
    id: string;
    transactionType: string;
    amount: number;
    status: string;
    createdAt: string;
    description: string;
}

export default function BillingPage() {
    const { user } = useAuthStore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [credits, setCredits] = useState<Credits>({ resumeReviews: 0, interviews: 0, skillTests: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchaseType, setPurchaseType] = useState<"RESUME_REVIEW" | "AI_INTERVIEW" | "SKILL_TEST" | null>(null);
    const [couponCode, setCouponCode] = useState("");
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState<string | null>(null);

    const validateCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        setCouponError(null);
        try {
            // Check both types or just general validation? 
            // Our backend validate endpoint requires a type. 
            // We'll try SUBSCRIPTION first as it's common, then CREDITS if it fails?
            // Actually, we can just allow the user to select or try one.
            // For dashboard, we'll try a general check if we had one, but we don't.
            // So we'll try SUBSCRIPTION by default for the dashboard input.
            const res = await authFetch('/billing/promotions/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, type: 'ALL' })
            });
            const data = await res.json();
            if (res.ok) {
                setAppliedCoupon(data.data);
                setCouponError(null);
            } else {
                setCouponError(data.message || 'Invalid coupon');
                setAppliedCoupon(null);
            }
        } catch (err) {
            setCouponError('Failed to validate coupon');
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const fetchBillingData = useCallback(async () => {
        try {

            // Parallel fetch for speed
            // Parallel fetch for speed
            const [subRes, creditsRes, transRes] = await Promise.all([
                authFetch(`/billing/subscriptions`),
                authFetch(`/billing/credits/balances`),
                authFetch(`/billing/credits/history`),
            ]);

            if (subRes.ok) {
                const data = await subRes.json();
                setSubscription(data.data);
            }

            if (creditsRes.ok) {
                const data = await creditsRes.json();
                // Backend returns object like { RESUME_REVIEW: 0, AI_INTERVIEW: 0, SKILL_TEST: 0 }
                const creditData = data.data || {};
                setCredits({
                    resumeReviews: creditData.RESUME_REVIEW || 0,
                    interviews: creditData.AI_INTERVIEW || 0,
                    skillTests: creditData.SKILL_TEST || 0
                });
            }

            if (transRes.ok) {
                const data = await transRes.json();
                setTransactions(data.data || []);
            }

        } catch (error) {
            console.error("Failed to fetch billing data", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchBillingData();
        }
    }, [user, fetchBillingData]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Credits</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and credit balances</p>
            </div>

            {/* Subscription Card */}
            <div className="p-6 rounded-xl glass border-l-4 border-indigo-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Plan</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-indigo-400">
                                {subscription?.plan?.displayName || "Free"}
                            </span>
                            {subscription?.status === 'ACTIVE' && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                                    Active
                                </span>
                            )}
                        </div>
                        {subscription?.currentPeriodEnd && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/pricing"
                            className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white transition flex items-center gap-2"
                        >
                            Change Plan
                        </Link>
                        {!subscription || subscription.plan.name === 'free' ? (
                            <Link
                                href="/pricing"
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
                            >
                                Upgrade Now
                            </Link>
                        ) : (
                            <button className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition">
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Promotions Section */}
            <div className="p-6 rounded-xl glass border-l-4 border-purple-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Tag className="w-5 h-5 text-purple-400" />
                            Promotions & Coupons
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Have a discount code? Apply it here for your next purchase.</p>
                    </div>

                    <div className="flex flex-col w-full md:w-auto gap-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1 md:w-64">
                                <input
                                    type="text"
                                    placeholder="ENTER CODE"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition uppercase"
                                />
                                {appliedCoupon && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                )}
                            </div>
                            <button
                                onClick={validateCoupon}
                                disabled={!couponCode || isValidatingCoupon || !!appliedCoupon}
                                className="px-6 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition shadow-lg shadow-purple-500/20 whitespace-nowrap disabled:opacity-50"
                            >
                                {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : (appliedCoupon ? 'Applied' : 'Apply')}
                            </button>
                        </div>
                        {couponError && (
                            <p className="flex items-center gap-1 text-[10px] text-rose-500 font-bold ml-1">
                                <AlertCircle className="w-3 h-3" /> {couponError}
                            </p>
                        )}
                        {appliedCoupon && (
                            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                                <div className="text-[10px] text-emerald-500 font-bold">
                                    <p>{appliedCoupon.code} applied!</p>
                                    <p className="opacity-70">
                                        Type: {appliedCoupon.applicableTo} |
                                        Discount: {appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                                    className="text-emerald-500 hover:text-emerald-400"
                                >
                                    <X className="w-3 h-4" />
                                </button>
                            </div>
                        )
                        }
                    </div>
                </div>
            </div>

            {/* Credit Balances */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Credit Balances
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CreditBalanceCard
                        type="Resume Reviews"
                        balance={credits.resumeReviews}
                        icon={FileText}
                        color="from-blue-400 to-cyan-400"
                        onPurchase={() => setPurchaseType("RESUME_REVIEW")}
                    />
                    <CreditBalanceCard
                        type="AI Interviews"
                        balance={credits.interviews}
                        icon={Video}
                        color="from-indigo-400 to-pink-400"
                        onPurchase={() => setPurchaseType("AI_INTERVIEW")}
                    />
                    <CreditBalanceCard
                        type="Skill Tests"
                        balance={credits.skillTests}
                        icon={FileQuestion}
                        color="from-amber-400 to-orange-400"
                        onPurchase={() => setPurchaseType("SKILL_TEST")}
                    />
                </div>
            </div>

            {/* Transaction History */}
            <div className="p-6 rounded-xl glass">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    Transaction History
                </h2>

                {loading ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading history...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                        No transactions yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition border border-gray-200 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        {tx.transactionType === 'PURCHASE' || tx.transactionType === 'GRANT' ? (
                                            <CreditCard className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-medium">{tx.description}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.transactionType === 'PURCHASE' || tx.transactionType === 'GRANT' ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.transactionType === 'PURCHASE' || tx.transactionType === 'GRANT' ? '+' : '-'}{Math.abs(tx.amount)}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Purchase Modal */}
            {purchaseType && (
                <CreditPurchaseModal
                    isOpen={!!purchaseType}
                    onClose={() => setPurchaseType(null)}
                    creditType={purchaseType}
                    initialCouponCode={appliedCoupon?.applicableTo === 'CREDITS' || appliedCoupon?.applicableTo === 'ALL' ? appliedCoupon.code : ""}
                    onSuccess={() => {
                        fetchBillingData();
                        setPurchaseType(null);
                        setAppliedCoupon(null);
                        setCouponCode("");
                    }}
                />
            )}
        </div>
    );
}



