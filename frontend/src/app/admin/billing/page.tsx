'use client';

import { useState, useEffect } from 'react';
import {
    CreditCard,
    DollarSign,
    Package,
    Settings,
    Plus,
    Edit3,
    Trash2,
    Power,
    PowerOff,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Save,
    RefreshCw,
    Users,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

type Tab = 'plans' | 'credits' | 'settings';

interface SubscriptionPlan {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    priceYearly: number;
    features: Record<string, any>;
    razorpayPlanId: string | null;
    isActive: boolean;
    sortOrder: number;
    _count?: { subscriptions: number };
}

interface CreditPricing {
    perCredit: Record<string, number>;
    bundles: Record<string, Array<{ quantity: number; price: number; savings: string }>>;
}

interface BillingSettings {
    billing_enabled: boolean;
    subscription_enabled: boolean;
    credit_pricing_enabled: boolean;
}

interface BillingStats {
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionsByPlan: Array<{ planId: string; planName: string; count: number }>;
    totalCreditsPurchased: number;
}

export default function AdminBillingPage() {
    const { accessToken } = useAuthStore();
    const [activeTab, setActiveTab] = useState<Tab>('plans');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Plans State
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [planForm, setPlanForm] = useState({
        name: '',
        displayName: '',
        priceMonthly: '',
        priceYearly: '',
        resumeReviews: '',
        interviews: '',
        skillTests: '',
        jobAlerts: true,
        prioritySupport: false,
        apiAccess: false,
        razorpayPlanId: '',
        isActive: true,
        sortOrder: '0'
    });

    // Credit Pricing State
    const [creditPricing, setCreditPricing] = useState<CreditPricing | null>(null);
    const [editedPricing, setEditedPricing] = useState<{
        perCredit: Record<string, string>;
        bundles: Record<string, Array<{ quantity: string; price: string; savings: string }>>;
    } | null>(null);

    // Settings State
    const [billingSettings, setBillingSettings] = useState<BillingSettings>({
        billing_enabled: true,
        subscription_enabled: true,
        credit_pricing_enabled: true
    });

    // Stats State
    const [stats, setStats] = useState<BillingStats | null>(null);

    useEffect(() => {
        if (accessToken) {
            loadData();
        }
    }, [accessToken, activeTab]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'plans') {
                await Promise.all([loadPlans(), loadStats()]);
            } else if (activeTab === 'credits') {
                await loadCreditPricing();
            } else if (activeTab === 'settings') {
                await loadBillingSettings();
            }
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPlans = async () => {
        const res = await fetch(`${API_URL}/admin/billing/plans`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            setPlans(data.data || []);
        }
    };

    const loadStats = async () => {
        const res = await fetch(`${API_URL}/admin/billing/stats`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            setStats(data.data);
        }
    };

    const loadCreditPricing = async () => {
        const res = await fetch(`${API_URL}/admin/billing/credit-pricing`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            setCreditPricing(data.data);
            setEditedPricing({
                perCredit: {
                    RESUME_REVIEW: String(data.data.perCredit.RESUME_REVIEW || 49),
                    AI_INTERVIEW: String(data.data.perCredit.AI_INTERVIEW || 99),
                    SKILL_TEST: String(data.data.perCredit.SKILL_TEST || 29)
                },
                bundles: {
                    RESUME_REVIEW: (data.data.bundles.RESUME_REVIEW || []).map((b: any) => ({
                        quantity: String(b.quantity),
                        price: String(b.price),
                        savings: b.savings
                    })),
                    AI_INTERVIEW: (data.data.bundles.AI_INTERVIEW || []).map((b: any) => ({
                        quantity: String(b.quantity),
                        price: String(b.price),
                        savings: b.savings
                    })),
                    SKILL_TEST: (data.data.bundles.SKILL_TEST || []).map((b: any) => ({
                        quantity: String(b.quantity),
                        price: String(b.price),
                        savings: b.savings
                    }))
                }
            });
        }
    };

    const loadBillingSettings = async () => {
        const res = await fetch(`${API_URL}/admin/billing/settings`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            setBillingSettings(data.data);
        }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const features = {
                resumeReviews: planForm.resumeReviews === 'unlimited' ? 'unlimited' : parseInt(planForm.resumeReviews) || 0,
                interviews: planForm.interviews === 'unlimited' ? 'unlimited' : parseInt(planForm.interviews) || 0,
                skillTests: planForm.skillTests === 'unlimited' ? 'unlimited' : parseInt(planForm.skillTests) || 0,
                jobAlerts: planForm.jobAlerts,
                prioritySupport: planForm.prioritySupport,
                apiAccess: planForm.apiAccess
            };

            const body = {
                name: planForm.name.toLowerCase().replace(/\s+/g, '_'),
                displayName: planForm.displayName,
                priceMonthly: parseFloat(planForm.priceMonthly) || 0,
                priceYearly: parseFloat(planForm.priceYearly) || 0,
                features,
                razorpayPlanId: planForm.razorpayPlanId || null,
                isActive: planForm.isActive,
                sortOrder: parseInt(planForm.sortOrder) || 0
            };

            const url = editingPlan
                ? `${API_URL}/admin/billing/plans/${editingPlan.id}`
                : `${API_URL}/admin/billing/plans`;

            const res = await fetch(url, {
                method: editingPlan ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('success', editingPlan ? 'Plan updated' : 'Plan created');
                setShowPlanModal(false);
                setEditingPlan(null);
                resetPlanForm();
                loadPlans();
            } else {
                const data = await res.json();
                showToast('error', data.error?.message || 'Failed to save plan');
            }
        } catch (err) {
            showToast('error', 'Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan? This cannot be undone.')) return;

        try {
            const res = await fetch(`${API_URL}/admin/billing/plans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                showToast('success', 'Plan deleted');
                loadPlans();
            } else {
                const data = await res.json();
                showToast('error', data.error?.message || 'Failed to delete plan');
            }
        } catch (err) {
            showToast('error', 'Failed to delete plan');
        }
    };

    const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
        try {
            const res = await fetch(`${API_URL}/admin/billing/plans/${plan.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ isActive: !plan.isActive })
            });

            if (res.ok) {
                showToast('success', `Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
                loadPlans();
            } else {
                showToast('error', 'Failed to update plan');
            }
        } catch (err) {
            showToast('error', 'Failed to update plan');
        }
    };

    const handleSaveCreditPricing = async () => {
        if (!editedPricing) return;
        setSaving(true);

        try {
            const perCredit = {
                RESUME_REVIEW: Math.round(parseFloat(editedPricing.perCredit.RESUME_REVIEW) * 100),
                AI_INTERVIEW: Math.round(parseFloat(editedPricing.perCredit.AI_INTERVIEW) * 100),
                SKILL_TEST: Math.round(parseFloat(editedPricing.perCredit.SKILL_TEST) * 100)
            };

            const bundles: Record<string, Array<{ quantity: number; price: number; savings: string }>> = {};
            for (const [key, items] of Object.entries(editedPricing.bundles)) {
                bundles[key] = items.map(item => ({
                    quantity: parseInt(item.quantity),
                    price: Math.round(parseFloat(item.price) * 100),
                    savings: item.savings
                }));
            }

            const res = await fetch(`${API_URL}/admin/billing/credit-pricing`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ perCredit, bundles })
            });

            if (res.ok) {
                showToast('success', 'Credit pricing updated');
                loadCreditPricing();
            } else {
                showToast('error', 'Failed to update pricing');
            }
        } catch (err) {
            showToast('error', 'Failed to update pricing');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBillingSettings = async () => {
        setSaving(true);

        try {
            const res = await fetch(`${API_URL}/admin/billing/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(billingSettings)
            });

            if (res.ok) {
                showToast('success', 'Billing settings updated');
            } else {
                showToast('error', 'Failed to update settings');
            }
        } catch (err) {
            showToast('error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const resetPlanForm = () => {
        setPlanForm({
            name: '',
            displayName: '',
            priceMonthly: '',
            priceYearly: '',
            resumeReviews: '',
            interviews: '',
            skillTests: '',
            jobAlerts: true,
            prioritySupport: false,
            apiAccess: false,
            razorpayPlanId: '',
            isActive: true,
            sortOrder: '0'
        });
    };

    const openEditPlanModal = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        const features = plan.features || {};
        setPlanForm({
            name: plan.name,
            displayName: plan.displayName,
            priceMonthly: String(plan.priceMonthly),
            priceYearly: String(plan.priceYearly),
            resumeReviews: String(features.resumeReviews || ''),
            interviews: String(features.interviews || ''),
            skillTests: String(features.skillTests || ''),
            jobAlerts: features.jobAlerts !== false,
            prioritySupport: features.prioritySupport === true,
            apiAccess: features.apiAccess === true,
            razorpayPlanId: plan.razorpayPlanId || '',
            isActive: plan.isActive,
            sortOrder: String(plan.sortOrder)
        });
        setShowPlanModal(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const creditTypeLabels: Record<string, string> = {
        RESUME_REVIEW: 'Resume Review',
        AI_INTERVIEW: 'AI Interview',
        SKILL_TEST: 'Skill Test'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Billing Management</h1>
                <button
                    onClick={() => loadData()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalSubscriptions}</p>
                                <p className="text-sm text-gray-400">Total Subscriptions</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
                                <p className="text-sm text-gray-400">Active Subscriptions</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Package className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{plans.length}</p>
                                <p className="text-sm text-gray-400">Total Plans</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl glass border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.totalCreditsPurchased}</p>
                                <p className="text-sm text-gray-400">Credits Purchased</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                {[
                    { id: 'plans', label: 'Subscription Plans', icon: Package },
                    { id: 'credits', label: 'Credit Pricing', icon: CreditCard },
                    { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            activeTab === tab.id
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                            toast.type === 'success'
                                ? 'bg-green-500/20 border border-green-500/30'
                                : 'bg-red-500/20 border border-red-500/30'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={toast.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                            {toast.message}
                        </span>
                        <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Plans Tab */}
                    {activeTab === 'plans' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setEditingPlan(null);
                                        resetPlanForm();
                                        setShowPlanModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Plan
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`p-5 rounded-xl glass border transition-colors ${
                                            plan.isActive ? 'border-white/10' : 'border-red-500/30 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-white">{plan.displayName}</h3>
                                                    {!plan.isActive && (
                                                        <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400">ID: {plan.name}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleTogglePlanActive(plan)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        plan.isActive
                                                            ? 'text-green-400 hover:bg-green-500/10'
                                                            : 'text-red-400 hover:bg-red-500/10'
                                                    }`}
                                                    title={plan.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {plan.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => openEditPlanModal(plan)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Monthly</p>
                                                <p className="text-xl font-bold text-white">{formatCurrency(plan.priceMonthly)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Yearly</p>
                                                <p className="text-xl font-bold text-white">{formatCurrency(plan.priceYearly)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Features</p>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.features?.resumeReviews && (
                                                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
                                                        {plan.features.resumeReviews === 'unlimited' ? '∞' : plan.features.resumeReviews} Resume Reviews
                                                    </span>
                                                )}
                                                {plan.features?.interviews && (
                                                    <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                                                        {plan.features.interviews === 'unlimited' ? '∞' : plan.features.interviews} Interviews
                                                    </span>
                                                )}
                                                {plan.features?.skillTests && (
                                                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                                                        {plan.features.skillTests === 'unlimited' ? '∞' : plan.features.skillTests} Skill Tests
                                                    </span>
                                                )}
                                                {plan.features?.prioritySupport && (
                                                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300">
                                                        Priority Support
                                                    </span>
                                                )}
                                                {plan.features?.apiAccess && (
                                                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">
                                                        API Access
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-white/5">
                                            <span>{plan._count?.subscriptions || 0} subscribers</span>
                                            <span>Sort: {plan.sortOrder}</span>
                                        </div>
                                    </div>
                                ))}
                                {plans.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        No subscription plans found. Create your first plan.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Credits Tab */}
                    {activeTab === 'credits' && editedPricing && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveCreditPricing}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>

                            {/* Per Credit Pricing */}
                            <div className="p-6 rounded-xl glass border border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4">Per-Credit Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(editedPricing.perCredit).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-300">
                                                {creditTypeLabels[key] || key}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => setEditedPricing({
                                                        ...editedPricing,
                                                        perCredit: { ...editedPricing.perCredit, [key]: e.target.value }
                                                    })}
                                                    className="w-full pl-8 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bundle Pricing */}
                            {Object.entries(editedPricing.bundles).map(([creditType, bundles]) => (
                                <div key={creditType} className="p-6 rounded-xl glass border border-white/5">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        {creditTypeLabels[creditType] || creditType} Bundles
                                    </h3>
                                    <div className="space-y-3">
                                        {bundles.map((bundle, index) => (
                                            <div key={index} className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={bundle.quantity}
                                                        onChange={(e) => {
                                                            const newBundles = [...bundles];
                                                            newBundles[index] = { ...bundle, quantity: e.target.value };
                                                            setEditedPricing({
                                                                ...editedPricing,
                                                                bundles: { ...editedPricing.bundles, [creditType]: newBundles }
                                                            });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={bundle.price}
                                                        onChange={(e) => {
                                                            const newBundles = [...bundles];
                                                            newBundles[index] = { ...bundle, price: e.target.value };
                                                            setEditedPricing({
                                                                ...editedPricing,
                                                                bundles: { ...editedPricing.bundles, [creditType]: newBundles }
                                                            });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Savings</label>
                                                    <input
                                                        type="text"
                                                        value={bundle.savings}
                                                        onChange={(e) => {
                                                            const newBundles = [...bundles];
                                                            newBundles[index] = { ...bundle, savings: e.target.value };
                                                            setEditedPricing({
                                                                ...editedPricing,
                                                                bundles: { ...editedPricing.bundles, [creditType]: newBundles }
                                                            });
                                                        }}
                                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="e.g., 20%"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="max-w-xl space-y-6">
                            <div className="p-6 rounded-xl glass border border-white/5 space-y-6">
                                <h3 className="text-lg font-semibold text-white">Billing Toggles</h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                        <div>
                                            <p className="font-medium text-white">Billing Enabled</p>
                                            <p className="text-sm text-gray-400">Master switch for all billing features</p>
                                        </div>
                                        <button
                                            onClick={() => setBillingSettings({
                                                ...billingSettings,
                                                billing_enabled: !billingSettings.billing_enabled
                                            })}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${
                                                billingSettings.billing_enabled ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                                                    billingSettings.billing_enabled ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                        <div>
                                            <p className="font-medium text-white">Subscriptions Enabled</p>
                                            <p className="text-sm text-gray-400">Allow users to subscribe to plans</p>
                                        </div>
                                        <button
                                            onClick={() => setBillingSettings({
                                                ...billingSettings,
                                                subscription_enabled: !billingSettings.subscription_enabled
                                            })}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${
                                                billingSettings.subscription_enabled ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                                                    billingSettings.subscription_enabled ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                                        <div>
                                            <p className="font-medium text-white">Credit Purchases Enabled</p>
                                            <p className="text-sm text-gray-400">Allow users to purchase credits</p>
                                        </div>
                                        <button
                                            onClick={() => setBillingSettings({
                                                ...billingSettings,
                                                credit_pricing_enabled: !billingSettings.credit_pricing_enabled
                                            })}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${
                                                billingSettings.credit_pricing_enabled ? 'bg-green-500' : 'bg-gray-600'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                                                    billingSettings.credit_pricing_enabled ? 'translate-x-6' : ''
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveBillingSettings}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Settings
                                </button>
                            </div>

                            {!billingSettings.billing_enabled && (
                                <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                        <div>
                                            <p className="font-medium text-red-300">Billing is currently disabled</p>
                                            <p className="text-sm text-red-400/80">
                                                Users will not be able to make any purchases while billing is disabled.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Plan Modal */}
            <AnimatePresence>
                {showPlanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingPlan ? 'Edit Plan' : 'New Subscription Plan'}
                                </h2>
                                <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSavePlan} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Plan Name (ID)</label>
                                        <input
                                            type="text"
                                            required
                                            value={planForm.name}
                                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g., starter"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={planForm.displayName}
                                            onChange={(e) => setPlanForm({ ...planForm, displayName: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g., Starter Plan"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Price (₹)</label>
                                        <input
                                            type="number"
                                            value={planForm.priceMonthly}
                                            onChange={(e) => setPlanForm({ ...planForm, priceMonthly: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Yearly Price (₹)</label>
                                        <input
                                            type="number"
                                            value={planForm.priceYearly}
                                            onChange={(e) => setPlanForm({ ...planForm, priceYearly: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-white/5 space-y-3">
                                    <p className="text-sm font-medium text-gray-300">Features (use "unlimited" for unlimited)</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Resume Reviews</label>
                                            <input
                                                type="text"
                                                value={planForm.resumeReviews}
                                                onChange={(e) => setPlanForm({ ...planForm, resumeReviews: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">AI Interviews</label>
                                            <input
                                                type="text"
                                                value={planForm.interviews}
                                                onChange={(e) => setPlanForm({ ...planForm, interviews: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Skill Tests</label>
                                            <input
                                                type="text"
                                                value={planForm.skillTests}
                                                onChange={(e) => setPlanForm({ ...planForm, skillTests: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="3"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={planForm.jobAlerts}
                                                onChange={(e) => setPlanForm({ ...planForm, jobAlerts: e.target.checked })}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                            />
                                            Job Alerts
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={planForm.prioritySupport}
                                                onChange={(e) => setPlanForm({ ...planForm, prioritySupport: e.target.checked })}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                            />
                                            Priority Support
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={planForm.apiAccess}
                                                onChange={(e) => setPlanForm({ ...planForm, apiAccess: e.target.checked })}
                                                className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                            />
                                            API Access
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Razorpay Plan ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={planForm.razorpayPlanId}
                                            onChange={(e) => setPlanForm({ ...planForm, razorpayPlanId: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="plan_xxxxx"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Sort Order</label>
                                        <input
                                            type="number"
                                            value={planForm.sortOrder}
                                            onChange={(e) => setPlanForm({ ...planForm, sortOrder: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={planForm.isActive}
                                        onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                                    />
                                    Plan is Active
                                </label>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowPlanModal(false)}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
