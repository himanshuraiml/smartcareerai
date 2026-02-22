'use client';

import { useState } from 'react';
import { X, Loader2, Building2, MapPin, Briefcase, Link as LinkIcon, DollarSign, ChevronRight, Diamond } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/providers/ThemeProvider';
import { authFetch } from '@/lib/auth-fetch';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const STATUS_OPTIONS = [
    { value: 'SAVED', label: 'Saved', color: 'bg-gray-500/20 text-gray-400' },
    { value: 'APPLIED', label: 'Applied', color: 'bg-violet-500/20 text-violet-400' },
    { value: 'SCREENING', label: 'Screening', color: 'bg-amber-500/20 text-amber-400' },
    { value: 'INTERVIEWING', label: 'Interviewing', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'OFFER', label: 'Offer', color: 'bg-emerald-500/20 text-emerald-400' },
];

interface AddApplicationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddApplicationDialog({ isOpen, onClose, onSuccess }: AddApplicationDialogProps) {
    const { user } = useAuthStore();
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        sourceUrl: '',
        salaryMin: '',
        status: 'APPLIED'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authFetch(`/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: formData.status,
                    job: {
                        title: formData.title,
                        company: formData.company,
                        location: formData.location,
                        sourceUrl: formData.sourceUrl,
                        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
                        description: 'Manual entry'
                    }
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
                setFormData({
                    title: '',
                    company: '',
                    location: '',
                    sourceUrl: '',
                    salaryMin: '',
                    status: 'APPLIED'
                });
            } else {
                console.error('Failed to create application');
                const data = await response.json();
                alert(data.message || 'Failed to create application');
            }
        } catch (err) {
            console.error('Error submitting application:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentStatus = STATUS_OPTIONS.find(s => s.value === formData.status);

    const cardBg = isLight ? '#ffffff' : '#111827';
    const inputBg = isLight ? '#f3f4f6' : '#1f2937';
    const inputBorder = isLight ? '#d1d5db' : '#374151';
    const textColor = isLight ? '#111827' : '#f9fafb';
    const labelColor = isLight ? '#6b7280' : '#9ca3af';
    const iconColor = isLight ? '#9ca3af' : '#6b7280';
    const placeholderNote = isLight ? '#9ca3af' : '#6b7280';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="w-full max-w-[680px] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border"
                style={{
                    background: cardBg,
                    color: textColor,
                    borderColor: inputBorder
                }}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-8 pt-8 pb-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                            Track New Application
                        </h2>
                        <p className="text-sm mt-1" style={{ color: labelColor }}>
                            Add a new role to your pipeline and get AI insights.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/10'}`}
                        style={{ color: labelColor }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                    {/* Row 1: Job Title + Company */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
                                Job Title <span className="text-violet-500">*</span>
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                    placeholder="e.g. Senior Designer"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
                                Company <span className="text-violet-500">*</span>
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
                                <input
                                    type="text"
                                    required
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                    placeholder="e.g. Airbnb"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Location + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                    placeholder="Remote / New York"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
                                Status
                            </label>
                            <div className="relative">
                                <Diamond className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full pl-10 pr-24 py-2.5 rounded-xl text-sm appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ background: cardBg }}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {currentStatus && (
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md pointer-events-none ${currentStatus.color}`}>
                                        {currentStatus.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Salary + Job Link */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
                                Salary
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
                                <input
                                    type="number"
                                    value={formData.salaryMin}
                                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                    placeholder="$120k"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: labelColor }}>
                                Job Link
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: iconColor }} />
                                <input
                                    type="url"
                                    value={formData.sourceUrl}
                                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textColor }}
                                    placeholder="https://linkedin.com/jobs/..."
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 pb-8 pt-4 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/10'}`}
                        style={{ color: labelColor }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-600/25"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Add Application
                        {!loading && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}



