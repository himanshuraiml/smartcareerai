"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

export default function PostJobPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        company: "", // Usually pre-filled from profile
        location: "",
        locationType: "onsite",
        description: "",
        requirements: "",
        requiredSkills: "",
        salaryMin: "",
        salaryMax: "",
        experienceMin: "",
        experienceMax: "",
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                requirements: formData.requirements.split('\n').filter(line => line.trim()),
                requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
                salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
                salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
                experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : undefined,
                experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : undefined,
            };

            const res = await authFetch(`/recruiter/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",

                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to post job");

            router.push("/recruiter/jobs");
        } catch (error) {
            alert("Error posting job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/recruiter/jobs" className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post a New Job</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create a job listing to find the perfect candidate</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="glass rounded-xl p-6 lg:p-8 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Job Title</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Senior React Developer"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Location</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. New York, NY"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Work Type</label>
                        <select
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 [&>option]:text-black"
                            value={formData.locationType}
                            onChange={e => setFormData({ ...formData, locationType: e.target.value })}
                        >
                            <option value="onsite">On-site</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Job Description</label>
                    <textarea
                        required
                        className="w-full h-32 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Describe the role and responsibilities..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Requirements (One per line)</label>
                    <textarea
                        required
                        className="w-full h-32 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="- 5+ years of experience&#10;- Strong knowledge of React"
                        value={formData.requirements}
                        onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Required Skills (Comma separated)</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                        placeholder="React, TypeScript, Node.js"
                        value={formData.requiredSkills}
                        onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
                    />
                </div>

                {/* Compensation & Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-white/5">
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Salary Range (Annual USD)</label>
                        <div className="flex gap-4">
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                placeholder="Min"
                                value={formData.salaryMin}
                                onChange={e => setFormData({ ...formData, salaryMin: e.target.value })}
                            />
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                placeholder="Max"
                                value={formData.salaryMax}
                                onChange={e => setFormData({ ...formData, salaryMax: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Experience (Years)</label>
                        <div className="flex gap-4">
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                placeholder="Min"
                                value={formData.experienceMin}
                                onChange={e => setFormData({ ...formData, experienceMin: e.target.value })}
                            />
                            <input
                                type="number"
                                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                placeholder="Max"
                                value={formData.experienceMax}
                                onChange={e => setFormData({ ...formData, experienceMax: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-6 flex justify-end gap-3">
                    <Link
                        href="/recruiter/jobs"
                        className="px-6 py-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? "Posting..." : "Post Job"}
                    </button>
                </div>
            </form>
        </div>
    );
}



