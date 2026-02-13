"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import useRazorpay from "@/hooks/useRazorpay";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface CreditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    creditType: "RESUME_REVIEW" | "AI_INTERVIEW" | "SKILL_TEST";
    onSuccess: () => void;
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
    ]};

export default function CreditPurchaseModal({
    isOpen,
    onClose,
    creditType,
    onSuccess}: CreditPurchaseModalProps) {
    const { user } = useAuthStore();
    const isRazorpayLoaded = useRazorpay();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePurchase = async (quantity: number) => {
        setLoading(true);
        try {
            // 1. Create Order
            const response = await fetch(`${API_URL}/billing/credits/order`, {
                method: "POST",
                credentials: 'include', headers: {
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    creditType,
                    quantity})});

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
                        await confirmPurchase(response, orderId, quantity);
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email},
                    theme: {
                        color: "#8B5CF6"}};

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error("Purchase error:", error);
            alert("Purchase failed. Please try again.");
            setLoading(false);
        }
    };

    const confirmPurchase = async (paymentResponse: any, orderId: string, quantity: number) => {
        try {
            const response = await fetch(`${API_URL}/billing/credits/confirm`, {
                method: "POST",
                credentials: 'include', headers: {
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    orderId,
                    paymentId: paymentResponse.razorpay_payment_id,
                    signature: paymentResponse.razorpay_signature,
                    creditType,
                    quantity})});

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
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/10 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-2">Buy {creditType.replace('_', ' ')} Credits</h2>
                <p className="text-gray-400 text-sm mb-6">Select a bundle to top up your account</p>

                <div className="space-y-4">
                    {bundles.map((bundle) => (
                        <button
                            key={bundle.quantity}
                            onClick={() => handlePurchase(bundle.quantity)}
                            disabled={loading}
                            className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition flex items-center justify-between group"
                        >
                            <div className="text-left">
                                <p className="text-white font-medium">{bundle.quantity} Credits</p>
                                <span className="text-xs text-green-400">{bundle.savings} Savings</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-white">₹{bundle.price}</span>
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



