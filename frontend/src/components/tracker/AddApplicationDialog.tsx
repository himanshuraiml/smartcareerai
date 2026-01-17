'use client';

import { useState } from 'react';
import { X, Loader2, Building2, MapPin, Briefcase, Link as LinkIcon, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface AddApplicationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddApplicationDialog({ isOpen, onClose, onSuccess }: AddApplicationDialogProps) {
    const { accessToken } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        sourceUrl: '',
        salaryMin: '',
        status: 'APPLIED',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: formData.status,
                    job: {
                        title: formData.title,
                        company: formData.company,
                        location: formData.location,
                        sourceUrl: formData.sourceUrl,
                        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
                        description: 'Manual entry',
                    }
                }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
                // Reset form
                setFormData({
                    title: '',
                    company: '',
                    location: '',
                    sourceUrl: '',
                    salaryMin: '',
                    status: 'APPLIED',
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Track New Application</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">Job Title *</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="e.g. Senior Frontend Engineer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">Company *</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="e.g. Google"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="e.g. Remote / New York"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-1 block">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="SAVED" className="bg-gray-900">Saved</option>
                                    <option value="APPLIED" className="bg-gray-900">Applied</option>
                                    <option value="SCREENING" className="bg-gray-900">Screening</option>
                                    <option value="INTERVIEWING" className="bg-gray-900">Interviewing</option>
                                    <option value="OFFER" className="bg-gray-900">Offer</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-1 block">Salary (Optional)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="number"
                                        value={formData.salaryMin}
                                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="e.g. 120000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-300 mb-1 block">Job Link (Optional)</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input
                                    type="url"
                                    value={formData.sourceUrl}
                                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Add Application
                    </button>
                </div>
            </div>
        </div>
    );
}
