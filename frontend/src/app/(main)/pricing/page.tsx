"use client";

import { useState, useEffect, Suspense } from "react";
import { Check, Loader2, Zap, Star, Briefcase, Gem, Tag, X, AlertCircle, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import useRazorpay from "@/hooks/useRazorpay";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/auth-fetch";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";


interface PlanFeature {
    text: string;
    included: boolean;
    isNew?: boolean;      // newly unlocked in this tier — highlight it
    nextPlan?: string;    // if locked, which plan unlocks it
}

interface PricingPlan {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    priceYearly: number;
    description: string;
    color: string;
    popular?: boolean;
    contactOnly?: boolean;
    icon: any;
    features: PlanFeature[];
}

const DEFAULT_PLANS: PricingPlan[] = [
    {
        id: "free",
        name: "free",
        displayName: "Free forever",
        priceMonthly: 0,
        priceYearly: 0,
        description: "Essential tools to get started with your career journey",
        color: "from-blue-400 to-cyan-400",
        icon: Zap,
        features: [
            { text: "3 AI Resume Scans / month", included: true },
            { text: "1 Mock Interview / month", included: true },
            { text: "3 Skill Tests / month", included: true },
            { text: "Community Support", included: true },
            { text: "Priority Support", included: false, nextPlan: "Starter" },
            { text: "Advanced Analytics", included: false, nextPlan: "Pro" },
        ],
    },
    {
        id: "starter",
        name: "starter",
        displayName: "Starter",
        priceMonthly: 349,
        priceYearly: 3299,
        description: "Perfect for active job seekers needing more practice",
        color: "from-indigo-400 to-violet-400",
        icon: Star,
        popular: true,
        features: [
            { text: "Priority Email Support", included: true, isNew: true },
            { text: "15 AI Resume Scans / month", included: true },
            { text: "6 Mock Interviews / month", included: true },
            { text: "10 Skill Tests / month", included: true },
            { text: "Advanced Mock Interviews", included: true },
            { text: "Advanced Analytics", included: false, nextPlan: "Pro" },
        ],
    },
    {
        id: "pro",
        name: "pro",
        displayName: "Pro",
        priceMonthly: 849,
        priceYearly: 7999,
        description: "Unlimited access for serious professionals",
        color: "from-amber-400 to-orange-400",
        icon: Briefcase,
        features: [
            { text: "Advanced Analytics & Profile Promotion", included: true, isNew: true },
            { text: "50 AI Resume Scans / month", included: true },
            { text: "25 Mock Interviews / month", included: true },
            { text: "25 Skill Tests / month", included: true },
            { text: "Skill Certification Badges", included: true },
            { text: "Priority 24/7 Support", included: true },
        ],
    },
    {
        id: "enterprise",
        name: "enterprise",
        displayName: "Enterprise",
        priceMonthly: 0,
        priceYearly: 0,
        description: "Custom plans for institutions, colleges & placement cells",
        color: "from-emerald-400 to-teal-400",
        icon: Gem,
        contactOnly: true,
        features: [
            { text: "Dedicated Success Manager", included: true, isNew: true },
            { text: "Unlimited Resume Scans", included: true },
            { text: "Unlimited Mock Interviews", included: true },
            { text: "Unlimited Skill Tests", included: true },
            { text: "Custom AI Models", included: true },
            { text: "White-label Reports & Full API Access", included: true },
        ],
    },
];

// Icon mapping for dynamic plans
const PLAN_ICONS: Record<string, any> = {
    free: Zap,
    starter: Star,
    pro: Briefcase,
    enterprise: Gem,
};

const PLAN_COLORS: Record<string, string> = {
    free: "from-blue-400 to-cyan-400",
    starter: "from-indigo-400 to-violet-400",
    pro: "from-amber-400 to-orange-400",
    enterprise: "from-emerald-400 to-teal-400",
};

function PricingContent() {
    const router = useRouter();
    const { user, _hasHydrated } = useAuthStore();
    const { toast } = useToast();
    const isRazorpayLoaded = useRazorpay();
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loading, setLoading] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const searchParams = useSearchParams();
    const [isLightMode, setIsLightMode] = useState(false);
    const [plans, setPlans] = useState<PricingPlan[]>(DEFAULT_PLANS);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    // Auto-validate if coupon provided in URL
    useEffect(() => {
        const urlCoupon = searchParams.get("coupon");
        if (urlCoupon) {
            validateCoupon();
        }
    }, []);

    // Detect light mode
    useEffect(() => {
        const checkTheme = () => {
            const isLight = !document.documentElement.classList.contains('dark');
            setIsLightMode(isLight);
        };

        checkTheme();

        // Watch for class changes on html element
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const validateCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        setCouponError(null);
        try {
            const res = await authFetch('/billing/promotions/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, type: 'SUBSCRIPTION' })
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

    // Fetch plans from API to stay in sync with admin/billing
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await authFetch('/billing/subscriptions/plans', { skipAuth: true });
                if (res.ok) {
                    const data = await res.json();
                    const dbPlans = data.data || [];
                    if (dbPlans.length > 0) {
                        // Map database plans to pricing display format
                        const mappedPlans: PricingPlan[] = dbPlans
                            .filter((p: any) => p.isActive)
                            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                            .map((p: any) => {
                                const features = p.features || {};
                                return {
                                    id: p.id,
                                    name: p.name,
                                    displayName: p.displayName,
                                    priceMonthly: Number(p.priceMonthly),
                                    priceYearly: Number(p.priceYearly),
                                    description: getDescriptionForPlan(p.name),
                                    color: PLAN_COLORS[p.name] || "from-gray-400 to-gray-500",
                                    icon: PLAN_ICONS[p.name] || Star,
                                    popular: p.name === "starter",
                                    contactOnly: p.name === "enterprise",
                                    features: formatFeatures(features),
                                };
                            });
                        if (mappedPlans.length > 0) {
                            setPlans(mappedPlans);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch plans, using defaults", err);
            }
        };
        fetchPlans();
    }, []);

    // Helper to get description based on plan name
    const getDescriptionForPlan = (name: string): string => {
        const descriptions: Record<string, string> = {
            free: "Essential tools to get started with your career journey",
            starter: "Perfect for active job seekers needing more practice",
            pro: "Unlimited access for serious professionals",
        };
        return descriptions[name] || "Boost your career with premium features";
    };

    // Helper to format features object into array
    const formatFeatures = (featuresObj: any): PlanFeature[] => {
        return Object.entries(featuresObj).map(([key, val]) => ({
            text: String(key).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            included: !!val && val !== "0"
        }));
    };

    const handleSubscribe = async (plan: PricingPlan) => {
        if (!_hasHydrated) return; // wait for localStorage rehydration
        if (!user) {
            router.push("/login?redirect=/pricing");
            return;
        }

        if (!user.isVerified) {
            toast({
                title: "Verification Required",
                description: "Please verify your email address to change plans or claim free credits.",
            });
            return;
        }

        setLoading(plan.id);

        try {
            // Free plan: activate directly without payment
            if (plan.priceMonthly === 0) {
                const response = await authFetch('/billing/subscriptions/subscribe', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ planName: plan.name })
                });
                if (response.status === 401) {
                    router.push("/login?redirect=/pricing");
                    return;
                }
                if (response.ok) {
                    router.push("/dashboard?upgrade=success");
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || "Failed to activate free plan.");
                }
                return;
            }

            // Step 1: Create Razorpay order on the backend
            const orderRes = await authFetch('/billing/subscriptions/order', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planName: plan.name, billingCycle }),
            });

            if (orderRes.status === 401) {
                router.push("/login?redirect=/pricing");
                return;
            }

            if (!orderRes.ok) {
                const err = await orderRes.json();
                throw new Error(err.error?.message || "Failed to create payment order.");
            }

            const { data: orderData } = await orderRes.json();
            const { orderId, amount, razorpayKeyId } = orderData;

            // Step 2: Open Razorpay Standard Checkout modal
            if (!isRazorpayLoaded || !window.Razorpay) {
                throw new Error("Payment gateway failed to load. Please refresh and try again.");
            }

            await new Promise<void>((resolve, reject) => {
                const options = {
                    key: razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount,
                    currency: "INR",
                    name: "PlaceNxt",
                    description: `${plan.displayName} – ${billingCycle === "yearly" ? "Annual" : "Monthly"} Plan`,
                    order_id: orderId,
                    handler: async (response: any) => {
                        try {
                            // Step 3: Verify signature and activate subscription
                            const confirmRes = await authFetch('/billing/subscriptions/confirm', {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    orderId: response.razorpay_order_id,
                                    paymentId: response.razorpay_payment_id,
                                    signature: response.razorpay_signature,
                                    planName: plan.name,
                                    billingCycle,
                                }),
                            });

                            if (confirmRes.status === 401) {
                                reject(new Error("SESSION_EXPIRED"));
                                return;
                            }

                            if (!confirmRes.ok) {
                                const err = await confirmRes.json();
                                reject(new Error(err.error?.message || "Payment verification failed."));
                                return;
                            }

                            resolve();
                            router.push("/dashboard?upgrade=success");
                        } catch (e) {
                            reject(e);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error("Payment cancelled.")),
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                    },
                    theme: { color: "#6366f1" },
                };

                const rzp = new window.Razorpay(options);
                rzp.on("payment.failed", (resp: any) => {
                    reject(new Error(resp.error?.description || "Payment failed."));
                });
                rzp.open();
            });

        } catch (error: any) {
            // Session expired during payment confirmation — redirect to login
            if (error?.message === "SESSION_EXPIRED") {
                router.push("/login?redirect=/pricing");
                return;
            }
            // Don't alert on user-cancelled payment
            if (error?.message && error.message !== "Payment cancelled.") {
                console.error("Subscription error:", error);
                alert(error.message || "Something went wrong. Please try again.");
            }
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-[#F7F9FC] text-slate-900' : 'bg-[#050B18] text-white'}`}>
            <Navbar />

            {/* Single page-level ambient glow */}
            {!isLightMode && (
                <div
                    className="pointer-events-none fixed inset-0 z-0"
                    style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(43,127,255,0.08) 0%, transparent 70%)' }}
                />
            )}

            <div className="max-w-6xl mx-auto px-4 pt-44 pb-24 relative z-10">
                {/* ── Header ── */}
                <div className="max-w-2xl mx-auto text-center mb-14">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border ${
                        isLightMode
                            ? 'bg-[#2B7FFF]/6 border-[#2B7FFF]/20 text-[#1B5FD8]'
                            : 'bg-[#2B7FFF]/10 border-[#2B7FFF]/25 text-[#5BA3FF]'
                    }`}>
                        <Zap className="w-3.5 h-3.5" />
                        Simple, transparent pricing
                    </div>
                    <h1
                        className="font-display mb-4"
                        style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, lineHeight: 1.1, color: isLightMode ? '#0D1117' : '#EFF4FB', letterSpacing: '-0.02em' }}
                    >
                        Invest in your career growth
                    </h1>
                    <p className={`text-base mb-10 ${isLightMode ? 'text-slate-500' : 'text-[#8FA5C7]'}`}>
                        Unlock premium AI tools to accelerate your job search and interview prep.
                    </p>

                    {/* Billing Toggle */}
                    <div className={`inline-flex items-center gap-1 p-1 rounded-xl border mb-8 ${
                        isLightMode ? 'bg-white border-slate-200' : 'bg-[#091324] border-[rgba(43,127,255,0.12)]'
                    }`}>
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                billingCycle === 'monthly'
                                    ? 'bg-[#2B7FFF] text-white shadow-[0_2px_8px_rgba(43,127,255,0.3)]'
                                    : isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-[#4A6080] hover:text-[#8FA5C7]'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                                billingCycle === 'yearly'
                                    ? 'bg-[#2B7FFF] text-white shadow-[0_2px_8px_rgba(43,127,255,0.3)]'
                                    : isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-[#4A6080] hover:text-[#8FA5C7]'
                            }`}
                        >
                            Yearly
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                billingCycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-500'
                            }`}>Save 20%</span>
                        </button>
                    </div>

                    {/* Coupon Code Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-xs">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Coupon code"
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                                            isLightMode
                                                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#2B7FFF] focus:ring-2 focus:ring-[#2B7FFF]/15'
                                                : 'bg-[#0E1E38] border-[rgba(43,127,255,0.15)] text-white placeholder:text-[#4A6080] focus:border-[#2B7FFF]/50 focus:ring-2 focus:ring-[#2B7FFF]/10'
                                        }`}
                                    />
                                    {appliedCoupon && (
                                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    )}
                                </div>
                                <button
                                    onClick={validateCoupon}
                                    disabled={!couponCode || isValidatingCoupon || !!appliedCoupon}
                                    className="px-5 py-2.5 rounded-xl bg-[#2B7FFF] text-white font-semibold text-sm hover:bg-[#1A6EEE] disabled:opacity-50 transition-all"
                                >
                                    {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                </button>
                            </div>
                            {couponError && (
                                <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {couponError}
                                </p>
                            )}
                            {appliedCoupon && (
                                <div className="mt-2 flex items-center justify-between w-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                                    <span className="text-xs text-emerald-500 font-semibold">
                                        {appliedCoupon.code}: {appliedCoupon.discountType === 'PERCENTAGE' ? `${appliedCoupon.discountValue}% off` : `₹${appliedCoupon.discountValue} off`}
                                    </span>
                                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-emerald-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 ${
                                plan.popular
                                    ? isLightMode
                                        ? 'bg-white border-2 border-[#2B7FFF] shadow-[0_4px_24px_rgba(43,127,255,0.15)]'
                                        : 'bg-[#091324] border-2 border-[#2B7FFF] shadow-[0_4px_32px_rgba(43,127,255,0.2)]'
                                    : isLightMode
                                        ? 'bg-white border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                                        : 'bg-[#091324] border border-[rgba(43,127,255,0.12)]'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2B7FFF] text-white text-[10px] font-semibold px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(43,127,255,0.35)]">
                                    Most popular
                                </div>
                            )}

                            {/* Plan icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${
                                plan.popular
                                    ? 'bg-[#2B7FFF]/15 text-[#2B7FFF]'
                                    : isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/[0.06] text-[#8FA5C7]'
                            }`}>
                                <plan.icon className="w-5 h-5" />
                            </div>

                            <h3
                                className="font-display mb-1"
                                style={{ fontSize: '1.125rem', fontWeight: 600, color: isLightMode ? '#0D1117' : '#EFF4FB' }}
                            >
                                {plan.displayName}
                            </h3>

                            {plan.contactOnly ? (
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span style={{ fontSize: '1.625rem', fontWeight: 700, color: isLightMode ? '#0D1117' : '#EFF4FB', fontFamily: 'var(--font-display)' }}>
                                        Contact us
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span
                                            style={{ fontSize: '1.875rem', fontWeight: 700, color: isLightMode ? '#0D1117' : '#EFF4FB', fontFamily: 'var(--font-display)' }}
                                        >
                                            ₹{appliedCoupon ? (
                                                appliedCoupon.discountType === 'PERCENTAGE'
                                                    ? Math.floor((billingCycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12)) * (1 - appliedCoupon.discountValue / 100))
                                                    : Math.max(0, (billingCycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12)) - appliedCoupon.discountValue)
                                            ) : (
                                                billingCycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12)
                                            )}
                                        </span>
                                        <span style={{ color: isLightMode ? '#8594AD' : '#4A6080', fontSize: '0.8rem' }}>/mo</span>
                                        {appliedCoupon && (
                                            <span className="text-xs line-through" style={{ color: isLightMode ? '#94a3b8' : '#4A6080' }}>
                                                ₹{billingCycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12)}
                                            </span>
                                        )}
                                    </div>
                                    {billingCycle === "yearly" && plan.priceYearly > 0 && (
                                        <p className="text-xs mb-3 text-emerald-500 font-medium">Billed ₹{appliedCoupon ? (
                                            appliedCoupon.discountType === 'PERCENTAGE'
                                                ? Math.floor(plan.priceYearly * (1 - appliedCoupon.discountValue / 100))
                                                : Math.max(0, plan.priceYearly - appliedCoupon.discountValue * (appliedCoupon.applicableTo === 'ALL' ? 12 : 1))
                                        ) : plan.priceYearly}/yr</p>
                                    )}
                                </>
                            )}

                            <p
                                className="text-xs mb-5 min-h-[32px] leading-relaxed"
                                style={{ color: isLightMode ? '#445069' : '#8FA5C7' }}
                            >
                                {plan.description}
                            </p>

                            <button
                                onClick={() => plan.contactOnly ? router.push('/contact') : handleSubscribe(plan)}
                                disabled={loading === plan.id}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 mb-6 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] ${
                                    plan.popular
                                        ? 'bg-[#2B7FFF] text-white hover:bg-[#1A6EEE] shadow-[0_2px_12px_rgba(43,127,255,0.3)]'
                                        : plan.contactOnly
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            : isLightMode
                                                ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                                : 'bg-white/[0.05] text-white border border-white/10 hover:bg-white/[0.09]'
                                }`}
                            >
                                {loading === plan.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : plan.contactOnly ? (
                                    'Get a Quote'
                                ) : (
                                    plan.priceMonthly === 0 ? 'Get started free' : 'Subscribe'
                                )}
                            </button>

                            <div className="space-y-2.5">
                                {plan.features.map((feature, i) => {
                                    if (feature.isNew) {
                                        return (
                                            <div key={i} className="flex items-start gap-2.5 text-xs">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isLightMode ? 'bg-[#2B7FFF]/15 text-[#2B7FFF]' : 'bg-[#2B7FFF]/20 text-[#5BA3FF]'}`}>
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                <span className={`font-semibold ${isLightMode ? 'text-[#2B7FFF]' : 'text-[#5BA3FF]'}`}>{feature.text}</span>
                                            </div>
                                        );
                                    }
                                    if (!feature.included) {
                                        return (
                                            <div key={i} className="flex items-start gap-2.5 text-xs">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isLightMode ? 'bg-slate-100' : 'bg-white/[0.03]'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isLightMode ? 'bg-slate-300' : 'bg-[#4A6080]'}`} />
                                                </div>
                                                <span style={{ color: isLightMode ? '#8594AD' : '#4A6080', textDecoration: 'line-through' }}>{feature.text}</span>
                                                {feature.nextPlan && (
                                                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                                        isLightMode ? 'bg-[#2B7FFF]/8 text-[#2B7FFF]' : 'bg-[#2B7FFF]/15 text-[#5BA3FF]'
                                                    }`}>→ {feature.nextPlan}</span>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={i} className="flex items-start gap-2.5 text-xs">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isLightMode ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                <Check className="w-2.5 h-2.5" />
                                            </div>
                                            <span style={{ color: isLightMode ? '#445069' : '#8FA5C7' }}>{feature.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* FAQ */}
            <div className="max-w-3xl mx-auto px-4 pb-24 relative z-10">
                <h2
                    className="font-display text-center mb-10"
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 600, color: isLightMode ? '#0D1117' : '#EFF4FB' }}
                >
                    Frequently asked questions
                </h2>
                <div className="space-y-2">
                    {[
                        { q: 'Can I switch plans later?', a: 'Yes. You can upgrade or downgrade at any time from your dashboard. Changes take effect at the start of the next billing cycle.' },
                        { q: 'Is there a free trial for paid plans?', a: "The Free plan is available indefinitely with no credit card required. Paid plans don't have a separate trial, but you can start on Free and upgrade when ready." },
                        { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards and UPI via Razorpay.' },
                        { q: 'Are the AI scores guaranteed to improve my placement chances?', a: 'Our AI provides data-driven feedback based on industry benchmarks. Results vary by individual effort and market conditions. Scores are for guidance — not a guarantee of placement.' },
                        { q: 'Can institutions get a custom plan?', a: "Yes. Institution plans are handled on a case-by-case basis. Reach out via the Contact page and we'll craft a plan that fits your batch size and needs." },
                        { q: 'What happens to my data if I cancel?', a: 'Your account data is retained for 30 days after cancellation. You can export your resume scans and interview history from the dashboard before then.' },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className={`rounded-xl border overflow-hidden transition-colors cursor-pointer ${isLightMode ? 'border-slate-200 bg-white' : 'border-[rgba(43,127,255,0.1)] bg-[#091324]'}`}
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                            >
                                <span className={`font-semibold text-sm ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{item.q}</span>
                                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-[#2B7FFF]' : isLightMode ? 'text-slate-400' : 'text-[#4A6080]'}`} />
                            </button>
                            {openFaq === i && (
                                <p className={`px-5 pb-4 text-sm leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-[#8FA5C7]'}`}>{item.a}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F19]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <PricingContent />
        </Suspense>
    );
}
