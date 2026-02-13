"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Zap, Star, Briefcase, Gem, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import useRazorpay from "@/hooks/useRazorpay";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Light mode card styles
const lightCardStyle = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
};

const darkCardStyle = {
    background: 'rgba(17, 24, 39, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
};

interface PlanFeature {
    text: string;
    included: boolean;
}

interface PricingPlan {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    priceYearly: number;
    description: string;
    features: PlanFeature[];
    popular?: boolean;
    color: string;
    icon: any;
}

const PLANS: PricingPlan[] = [
    {
        id: "free",
        name: "free",
        displayName: "Free",
        priceMonthly: 0,
        priceYearly: 0,
        description: "Essential tools to get started with your career journey",
        color: "from-blue-400 to-cyan-400",
        icon: Zap,
        features: [
            { text: "3 Resume Reviews/mo", included: true },
            { text: "1 AI Interview/mo", included: true },
            { text: "3 Skill Tests/mo", included: true },
            { text: "Basic Job Alerts", included: true },
            { text: "Priority Support", included: false },
            { text: "API Access", included: false },
        ],
    },
    {
        id: "starter",
        name: "starter",
        displayName: "Starter",
        priceMonthly: 299,
        priceYearly: 2499,
        description: "Perfect for active job seekers needing more practice",
        color: "from-indigo-400 to-violet-400",
        icon: Star,
        popular: true,
        features: [
            { text: "15 Resume Reviews/mo", included: true },
            { text: "5 AI Interviews/mo", included: true },
            { text: "10 Skill Tests/mo", included: true },
            { text: "Advanced Job Alerts", included: true },
            { text: "Priority Support", included: false },
            { text: "API Access", included: false },
        ],
    },
    {
        id: "pro",
        name: "pro",
        displayName: "Pro",
        priceMonthly: 799,
        priceYearly: 6999,
        description: "Unlimited access for serious professionals",
        color: "from-amber-400 to-orange-400",
        icon: Briefcase,
        features: [
            { text: "Unlimited Resume Reviews", included: true },
            { text: "20 AI Interviews/mo", included: true },
            { text: "Unlimited Skill Tests", included: true },
            { text: "Real-time Job Alerts", included: true },
            { text: "Priority Support", included: true },
            { text: "API Access", included: false },
        ],
    },
    {
        id: "enterprise",
        name: "enterprise",
        displayName: "Enterprise",
        priceMonthly: 1999,
        priceYearly: 17999,
        description: "For institutions and power users requiring API access",
        color: "from-emerald-400 to-teal-400",
        icon: Gem,
        features: [
            { text: "Unlimited Everything", included: true },
            { text: "Custom AI Models", included: true },
            { text: "Dedicated Success Manager", included: true },
            { text: "White-label Reports", included: true },
            { text: "24/7 Priority Support", included: true },
            { text: "Full API Access", included: true },
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

export default function PricingPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const isRazorpayLoaded = useRazorpay();
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loading, setLoading] = useState<string | null>(null);
    const [isLightMode, setIsLightMode] = useState(false);
    const [plans, setPlans] = useState<PricingPlan[]>(PLANS);
    const [plansLoading, setPlansLoading] = useState(true);

    // Detect light mode
    useEffect(() => {
        const checkTheme = () => {
            const isLight = document.documentElement.classList.contains('light-mode');
            setIsLightMode(isLight);
        };

        checkTheme();

        // Watch for class changes on html element
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Fetch plans from API to stay in sync with admin/billing
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch(`${API_URL}/billing/subscriptions/plans`);
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
            } finally {
                setPlansLoading(false);
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
            enterprise: "For institutions and power users requiring API access",
        };
        return descriptions[name] || "Boost your career with premium features";
    };

    // Format features from database to display format
    const formatFeatures = (features: any): PlanFeature[] => {
        const featureList: PlanFeature[] = [];
        if (features.resumeReviews !== undefined) {
            const text = features.resumeReviews === 'unlimited' ? 'Unlimited Resume Reviews' : `${features.resumeReviews} Resume Reviews/mo`;
            featureList.push({ text, included: true });
        }
        if (features.interviews !== undefined) {
            const text = features.interviews === 'unlimited' ? 'Unlimited AI Interviews' : `${features.interviews} AI Interviews/mo`;
            featureList.push({ text, included: true });
        }
        if (features.skillTests !== undefined) {
            const text = features.skillTests === 'unlimited' ? 'Unlimited Skill Tests' : `${features.skillTests} Skill Tests/mo`;
            featureList.push({ text, included: true });
        }
        featureList.push({ text: features.jobAlerts ? "Job Alerts" : "Basic Job Alerts", included: true });
        featureList.push({ text: "Priority Support", included: features.prioritySupport === true });
        featureList.push({ text: "API Access", included: features.apiAccess === true });
        return featureList;
    };

    const handleSubscribe = async (plan: PricingPlan) => {
        if (!user) {
            router.push("/login?redirect=/pricing");
            return;
        }

        setLoading(plan.id);

        try {
            // For free plan, still need to call subscribe API to initialize credits
            if (plan.name === "free") {
                const response = await fetch(`${API_URL}/billing/subscriptions/subscribe`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        planName: "free",
                        userEmail: user?.email,
                        userName: user?.name,
                    }),
                    credentials: 'include',
                });

                if (response.ok) {
                    router.push("/dashboard");
                } else {
                    const errorData = await response.json();
                    console.error("Failed to subscribe to free plan:", errorData);
                    alert("Failed to activate free plan. Please try again.");
                }
                return;
            }

            // 1. Create Subscription on Backend for paid plans
            const response = await fetch(`${API_URL}/billing/subscriptions/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planName: plan.name,
                    billingCycle: billingCycle, // Send selected billing cycle (monthly/yearly)
                }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create subscription");
            }

            const { razorpaySubscriptionId, paymentUrl } = data.data;

            // 2. Open Razorpay Checkout
            if (isRazorpayLoaded && window.Razorpay) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Add this to frontend .env
                    subscription_id: razorpaySubscriptionId,
                    name: "PlaceNxt",
                    description: `${plan.displayName} Subscription`,
                    image: "/logo.svg", // Ensure this exists
                    handler: function (response: any) {
                        // Payment successful
                        // You can optionally call a verification backend endpoint here
                        // But webhook handles the actual activation
                        if (response.razorpay_payment_id) {
                            router.push("/dashboard?upgrade=success");
                        }
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                    },
                    theme: {
                        color: "#6366f1",
                    },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // Fallback to hosted page if JS fails
                if (paymentUrl) window.location.href = paymentUrl;
            }

        } catch (error) {
            console.error("Subscription error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white py-20 px-4 pricing-page">
            {/* Back Button */}
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={() => user ? router.push('/dashboard') : router.push('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to {user ? 'Dashboard' : 'Home'}</span>
                </button>
            </div>

            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                    Invest in Your Career Growth
                </h1>
                <p className="text-xl text-gray-400 mb-8">
                    Unlock premium AI tools to accelerate your job search and interview prep.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4">
                    <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-medium' : 'text-gray-500'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-7 bg-gray-800 rounded-full p-1 relative transition-colors duration-300 border border-white/10"
                    >
                        <div className={`w-5 h-5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-lg transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white font-medium' : 'text-gray-500'}`}>
                        Yearly <span className="text-green-400 text-xs ml-1">(Save ~20%)</span>
                    </span>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative rounded-2xl p-6 pricing-card transition-all duration-300 group`}
                        style={isLightMode ? {
                            background: '#ffffff',
                            border: plan.popular ? '2px solid #6366f1' : '1px solid #e2e8f0',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                        } : {
                            background: 'rgba(17, 24, 39, 0.5)',
                            border: plan.popular ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                MOST POPULAR
                            </div>
                        )}

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} bg-opacity-10 flex items-center justify-center mb-6`}>
                            <plan.icon className="w-6 h-6 text-white" />
                        </div>

                        <h3
                            className="text-xl font-bold mb-2"
                            style={{ color: isLightMode ? '#0f172a' : '#ffffff' }}
                        >
                            {plan.displayName}
                        </h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span
                                className="text-3xl font-bold"
                                style={{ color: isLightMode ? '#1e293b' : '#ffffff' }}
                            >
                                ₹{billingCycle === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12)}
                            </span>
                            <span style={{ color: isLightMode ? '#64748b' : '#9ca3af' }} className="text-sm">/month</span>
                        </div>
                        {billingCycle === "yearly" && plan.priceYearly > 0 && (
                            <p className="text-xs mb-4" style={{ color: '#16a34a' }}>Billed ₹{plan.priceYearly} yearly</p>
                        )}

                        <p
                            className="text-sm mb-6 min-h-[40px]"
                            style={{ color: isLightMode ? '#475569' : '#9ca3af' }}
                        >
                            {plan.description}
                        </p>

                        <button
                            onClick={() => handleSubscribe(plan)}
                            disabled={loading === plan.id}
                            className={`w-full py-3 rounded-xl font-medium transition-all mb-8 flex items-center justify-center gap-2`}
                            style={plan.popular ? {
                                background: 'linear-gradient(to right, #6366f1, #ec4899)',
                                color: '#ffffff'
                            } : {
                                background: isLightMode ? '#f1f5f9' : 'rgba(255, 255, 255, 0.1)',
                                color: isLightMode ? '#1e293b' : '#ffffff',
                                border: isLightMode ? '1px solid #e2e8f0' : 'none'
                            }}
                        >
                            {loading === plan.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                plan.priceMonthly === 0 ? "Get Started" : "Subscribe Now"
                            )}
                        </button>

                        <div className="space-y-3">
                            {plan.features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{
                                            background: feature.included
                                                ? (isLightMode ? 'rgba(22, 163, 74, 0.15)' : 'rgba(34, 197, 94, 0.2)')
                                                : (isLightMode ? '#f1f5f9' : 'rgba(31, 41, 55, 1)'),
                                            color: feature.included ? '#16a34a' : '#9ca3af'
                                        }}
                                    >
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span
                                        style={{
                                            color: feature.included
                                                ? (isLightMode ? '#334155' : '#d1d5db')
                                                : (isLightMode ? '#94a3b8' : '#4b5563'),
                                            textDecoration: feature.included ? 'none' : 'line-through'
                                        }}
                                    >
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


