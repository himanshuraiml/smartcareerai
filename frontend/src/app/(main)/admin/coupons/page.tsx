'use client';

import { useState, useEffect } from 'react';
import {
    Ticket,
    Plus,
    Edit3,
    Trash2,
    RefreshCw,
    Search,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Save,
    Calendar,
    Tag,
    Clock,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '@/lib/auth-fetch';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface Coupon {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    applicableTo: 'SUBSCRIPTION' | 'CREDITS' | 'ALL';
    maxUses: number | null;
    usedCount: number;
    expiryDate: string | null;
    isActive: boolean;
    createdAt: string;
}

export default function AdminCouponsPage() {
    const { user } = useAuthStore();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const [form, setForm] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        applicableTo: 'ALL',
        maxUses: '',
        expiryDate: '',
        isActive: true
    });

    useEffect(() => {
        if (user) {
            loadCoupons();
        }
    }, [user]);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/admin/billing/coupons');
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load coupons', err);
            showToast('error', 'Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const body = {
                ...form,
                discountValue: parseFloat(form.discountValue),
                maxUses: form.maxUses ? parseInt(form.maxUses) : null,
                expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
            };

            const url = editingCoupon
                ? `/admin/billing/coupons/${editingCoupon.id}`
                : '/admin/billing/coupons';

            const res = await authFetch(url, {
                method: editingCoupon ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                showToast('success', editingCoupon ? 'Coupon updated' : 'Coupon created');
                setShowModal(false);
                setEditingCoupon(null);
                resetForm();
                loadCoupons();
            } else {
                const data = await res.json();
                showToast('error', data.message || 'Failed to save coupon');
            }
        } catch (err) {
            showToast('error', 'Failed to save coupon');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        try {
            const res = await authFetch(`/admin/billing/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('success', 'Coupon deleted');
                loadCoupons();
            } else {
                showToast('error', 'Failed to delete coupon');
            }
        } catch (err) {
            showToast('error', 'Failed to delete coupon');
        }
    };

    const resetForm = () => {
        setForm({
            code: '',
            discountType: 'PERCENTAGE',
            discountValue: '',
            applicableTo: 'ALL',
            maxUses: '',
            expiryDate: '',
            isActive: true
        });
    };

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setForm({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            applicableTo: coupon.applicableTo,
            maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
            expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
            isActive: coupon.isActive
        });
        setShowModal(true);
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Ticket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Coupon Codes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage discounts and promotions</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadCoupons}
                        className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/50 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Create Coupon
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search coupon code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>
            </div>

            {/* Coupons List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCoupons.map((coupon) => (
                        <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`group p-5 rounded-2xl border bg-white dark:bg-gray-800/50 transition-all hover:shadow-xl ${!coupon.isActive ? 'opacity-60 grayscale border-gray-200 dark:border-white/5' : 'border-purple-500/20 dark:border-purple-500/10'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-black tracking-wider text-purple-600 dark:text-purple-400">
                                            {coupon.code}
                                        </span>
                                        {!coupon.isActive && (
                                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500">INACTIVE</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Tag className="w-3 h-3" />
                                        <span>{coupon.applicableTo} Purchases</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(coupon)}
                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-purple-500"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-rose-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-400 uppercase tracking-tighter">Discount</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-400 uppercase tracking-tighter">Usage</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {coupon.usedCount} / {coupon.maxUses || '∞'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Expires: {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Coupon Code</label>
                                    <input
                                        required
                                        type="text"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="e.g. FLAT50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type</label>
                                        <select
                                            value={form.discountType}
                                            onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="PERCENTAGE">Percentage</option>
                                            <option value="FIXED_AMOUNT">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Value</label>
                                        <input
                                            required
                                            type="number"
                                            value={form.discountValue}
                                            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder={form.discountType === 'PERCENTAGE' ? '%' : '₹'}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Applicable To</label>
                                    <select
                                        value={form.applicableTo}
                                        onChange={(e) => setForm({ ...form, applicableTo: e.target.value as any })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="ALL">All Purchases</option>
                                        <option value="SUBSCRIPTION">Subscriptions Only</option>
                                        <option value="CREDITS">Credits Only</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Max Uses</label>
                                        <input
                                            type="number"
                                            value={form.maxUses}
                                            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={form.expiryDate}
                                            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 py-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${form.isActive ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? 'left-7' : 'left-1'}`} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Coupon</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-purple-500/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-md ${toast.type === 'success'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <p className="text-sm font-bold">{toast.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
