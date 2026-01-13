"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Video, FileQuestion, ArrowRight, Wallet, History, CreditCard } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
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
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    description: string;
}

export default function BillingPage() {
    const { accessToken, user } = useAuthStore();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [credits, setCredits] = useState<Credits>({ resumeReviews: 0, interviews: 0, skillTests: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchaseType, setPurchaseType] = useState<"RESUME_REVIEW" | "AI_INTERVIEW" | "SKILL_TEST" | null>(null);

    const fetchBillingData = useCallback(async () => {
        try {
            const headers = { Authorization: `Bearer ${accessToken}` };

            // Parallel fetch for speed
            const [subRes, creditsRes, transRes] = await Promise.all([
                fetch(`${API_URL}/billing/subscription/me`, { headers }),
                fetch(`${API_URL}/billing/credits/balance`, { headers }),
                fetch(`${API_URL}/billing/credits/history`, { headers }),
            ]);

            if (subRes.ok) {
                const data = await subRes.json();
                setSubscription(data.data);
            }

            if (creditsRes.ok) {
                const data = await creditsRes.json();
                // Backend returns array of credits, robustly map to object
                const creditMap = { resumeReviews: 0, interviews: 0, skillTests: 0 };
                data.data.forEach((c: any) => {
                    if (c.creditType === 'RESUME_REVIEW') creditMap.resumeReviews = c.balance;
                    if (c.creditType === 'AI_INTERVIEW') creditMap.interviews = c.balance;
                    if (c.creditType === 'SKILL_TEST') creditMap.skillTests = c.balance;
                });
                setCredits(creditMap);
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
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchBillingData();
        }
    }, [accessToken, fetchBillingData]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Billing & Credits</h1>
                <p className="text-gray-400 mt-1">Manage your subscription and credit balances</p>
            </div>

            {/* Subscription Card */}
            <div className="p-6 rounded-xl glass border-l-4 border-purple-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">Current Plan</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-purple-400">
                                {subscription?.plan?.displayName || "Free"}
                            </span>
                            {subscription?.status === 'ACTIVE' && (
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase">
                                    Active
                                </span>
                            )}
                        </div>
                        {subscription?.currentPeriodEnd && (
                            <p className="text-gray-400 text-sm mt-2">
                                Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/pricing"
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition flex items-center gap-2"
                        >
                            Change Plan
                        </Link>
                        {!subscription || subscription.plan.name === 'free' ? (
                            <Link
                                href="/pricing"
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition shadow-lg shadow-purple-500/20"
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

            {/* Credit Balances */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-gray-400" />
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
                        color="from-purple-400 to-pink-400"
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
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    Transaction History
                </h2>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading history...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        No transactions yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                                        {tx.type === 'PURCHASE' ? (
                                            <CreditCard className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5 text-blue-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{tx.description}</p>
                                        <p className="text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-bold">
                                        {tx.type === 'PURCHASE' ? '+' : '-'}{tx.amount}
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
                    onSuccess={() => {
                        fetchBillingData();
                        setPurchaseType(null);
                    }}
                />
            )}
        </div>
    );
}
