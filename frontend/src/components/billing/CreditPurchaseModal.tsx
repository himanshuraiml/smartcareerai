"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Tag, Check, AlertCircle } from "lucide-react";
import useRazorpay from "@/hooks/useRazorpay";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from '@/lib/auth-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface CreditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    creditType: "RESUME_REVIEW" | "AI_INTERVIEW" | "SKILL_TEST";
    onSuccess: () => void;
    initialCouponCode?: string;
}

const CREDIT_BUNDLES = {
    RESUME_REVIEW: [
        { quantity: 5, price: 199, savings: "20%" },
        { quantity: 10, price: 349, savings: "30%" },
        { quantity: 25, price: 749, savings: "40%" },
    ],
    AI_INTERVIEW: [
        { quantity: 5, price: 399, savings: "20%" },
        { quantity: 10, price: 699, savings: "30%" },
        { quantity: 25, price: 1499, savings: "40%" },
    ],
    SKILL_TEST: [
        { quantity: 10, price: 249, savings: "15%" },
        { quantity: 25, price: 549, savings: "25%" },
        { quantity: 50, price: 999, savings: "35%" },
    ]
};

export default function CreditPurchaseModal({
    isOpen,
    onClose,
    creditType,
    onSuccess,
    initialCouponCode }: CreditPurchaseModalProps) {
    const { user } = useAuthStore();
    const isRazorpayLoaded = useRazorpay();
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState(initialCouponCode || "");
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Auto-validate initial coupon
    useEffect(() => {
        if (initialCouponCode && isOpen) {
            validateCoupon();
        }
    }, [initialCouponCode, isOpen]);

    if (!isOpen) return null;

    const validateCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        setCouponError(null);
        try {
            const res = await authFetch('/billing/promotions/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, type: 'CREDITS' })
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

    const handlePurchase = async (quantity: number) => {
        setLoading(true);
        try {
            // 1. Create Order
            const response = await authFetch(`/billing/credits/order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    creditType,
                    quantity,
                    couponCode: appliedCoupon?.code
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Failed to create order");

            const { orderId, amount, razorpayKeyId } = data.data;

            // 2. Open Razorpay
            if (isRazorpayLoaded && window.Razorpay) {
                const options = {
                    key: razorpayKeyId,
                    amount: amount * 100, // Amount is in INR, Razorpay takes paise
                    currency: "INR",
                    name: "PlaceNxt",
                    description: `Purchase ${quantity} ${creditType} Credits`,
                    order_id: orderId,
                    handler: async function (response: any) {
                        // 3. Confirm Purchase
                        await confirmPurchase(response, orderId, quantity, appliedCoupon?.id);
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email
                    },
                    theme: {
                        color: "#8B5CF6"
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error("Purchase error:", error);
            alert("Purchase failed. Please try again.");
            setLoading(false);
        }
    };

    const confirmPurchase = async (paymentResponse: any, orderId: string, quantity: number, couponId?: string) => {
        try {
            const response = await authFetch(`/billing/credits/confirm`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    orderId,
                    paymentId: paymentResponse.razorpay_payment_id,
                    signature: paymentResponse.razorpay_signature,
                    creditType,
                    quantity,
                    couponId
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Confirmation error:", error);
        } finally {
            setLoading(false);
        }
    };

    const bundles = CREDIT_BUNDLES[creditType];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-white/10 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Buy {creditType.replace('_', ' ')} Credits</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Select a bundle to top up your account</p>

                {/* Coupon Input */}
                <div className="mb-6 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Have a coupon code?</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="ENTER CODE"
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {appliedCoupon && (
                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            )}
                        </div>
                        <button
                            onClick={validateCoupon}
                            disabled={!couponCode || isValidatingCoupon || !!appliedCoupon}
                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold text-indigo-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                            {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                    </div>
                    {couponError && (
                        <p className="flex items-center gap-1 text-[10px] text-rose-500 font-bold ml-1">
                            <AlertCircle className="w-3 h-3" /> {couponError}
                        </p>
                    )}
                    {appliedCoupon && (
                        <p className="text-[10px] text-emerald-500 font-bold ml-1 flex items-center justify-between">
                            <span>Coupon "{appliedCoupon.code}" applied!</span>
                            <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="underline">Remove</button>
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    {bundles.map((bundle) => (
                        <button
                            key={bundle.quantity}
                            onClick={() => handlePurchase(bundle.quantity)}
                            disabled={loading}
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 hover:border-indigo-500/50 transition flex items-center justify-between group"
                        >
                            <div className="text-left">
                                <p className="text-gray-900 dark:text-white font-medium">{bundle.quantity} Credits</p>
                                <span className="text-xs text-green-400">{bundle.savings} Savings</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    {appliedCoupon ? (
                                        <>
                                            <span className="text-xs text-gray-500 line-through">₹{bundle.price}</span>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                ₹{appliedCoupon.discountType === 'PERCENTAGE'
                                                    ? Math.floor(bundle.price * (1 - appliedCoupon.discountValue / 100))
                                                    : Math.max(0, bundle.price - appliedCoupon.discountValue)}
                                            </p>
                                        </>
                                    ) : (
                                        <span className="text-xl font-bold text-gray-900 dark:text-white">₹{bundle.price}</span>
                                    )}
                                </div>
                                {loading ? (
                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500 transition">
                                        <span className="text-indigo-400 group-hover:text-white text-sm font-bold">+</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}



