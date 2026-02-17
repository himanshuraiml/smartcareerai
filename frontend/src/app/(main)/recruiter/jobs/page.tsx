"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Plus,
    MoreVertical,
    MapPin,
    DollarSign,
    Clock,
    Briefcase
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Job {
    id: string;
    title: string;
    location: string;
    locationType: string;
    salaryMin?: number;
    salaryMax?: number;
    isActive: boolean;
    createdAt: string;
    _count?: {
        applications: number;
    };
}

export default function JobPostingsPage() {
    const { user } = useAuthStore();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const response = await authFetch(`/recruiter/jobs`);

            if (response.ok) {
                const data = await response.json();
                setJobs(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchJobs();
    }, [user]);

    const toggleStatus = async (jobId: string) => {
        try {
            const response = await authFetch(`/recruiter/jobs/${jobId}/toggle`, {
                method: 'PUT'
            });
            if (response.ok) {
                fetchJobs(); // Refresh
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteJob = async (jobId: string) => {
        if (!confirm("Delete this job posting?")) return;
        try {
            const response = await authFetch(`/recruiter/jobs/${jobId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setJobs(prev => prev.filter(j => j.id !== jobId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Job Postings</h1>
                    <p className="text-gray-400 mt-1">Manage your active listings</p>
                </div>
                <Link
                    href="/recruiter/post-job"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:opacity-90 transition"
                >
                    <Plus className="w-5 h-5" />
                    Post New Job
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading jobs...</div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No job postings yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {jobs.map(job => (
                        <div key={job.id} className="p-6 rounded-xl glass border border-white/5 hover:border-blue-500/30 transition group relative">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">{job.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${job.isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {job.isActive ? 'Active' : 'Closed'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {job.location} ({job.locationType})
                                        </span>
                                        {(job.salaryMin || job.salaryMax) && (
                                            <span className="flex items-center gap-1 text-gray-300">
                                                <DollarSign className="w-4 h-4" />
                                                ₹{job.salaryMin?.toLocaleString()} - ₹{job.salaryMax?.toLocaleString()}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Posted {new Date(job.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(job.id)}
                                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-gray-300 hover:bg-white/5 transition"
                                    >
                                        {job.isActive ? 'Close Job' : 'Reopen'}
                                    </button>
                                    <button
                                        onClick={() => deleteJob(job.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition"
                                    >
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



