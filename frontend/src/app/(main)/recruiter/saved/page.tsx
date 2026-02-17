"use client";

import { useState, useEffect } from "react";
import {
    Bookmark,
    Trash2,
    MessageSquare,
    MoreHorizontal,
    Clock,
    CheckCircle,
    XCircle
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface SavedCandidate {
    id: string; // The saved record ID
    candidateId: string;
    notes: string;
    status: string;
    savedAt: string;
    candidate: {
        name: string;
        email: string;
        avatarUrl?: string;
        userSkills: Array<{ skill: { name: string } }>;
    };
}

export default function SavedCandidatesPage() {
    const { user } = useAuthStore();
    const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const response = await authFetch(`/recruiter/candidates/saved`);

                if (response.ok) {
                    const data = await response.json();
                    setCandidates(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch saved candidates", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchSaved();
    }, [user]);

    const removeCandidate = async (candidateId: string) => {
        try {
            const response = await authFetch(`/recruiter/candidates/${candidateId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                setCandidates(prev => prev.filter(c => c.candidateId !== candidateId));
            }
        } catch (error) {
            console.error("Failed to remove candidate", error);
        }
    };

    const updateStatus = async (candidateId: string, status: string) => {
        try {
            const response = await authFetch(`/recruiter/candidates/${candidateId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setCandidates(prev => prev.map(c =>
                    c.candidateId === candidateId ? { ...c, status } : c
                ));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-400">Loading saved candidates...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Saved Candidates</h1>
                <p className="text-gray-400 mt-1">Manage and track your potential hires</p>
            </div>

            {candidates.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No saved candidates yet.</p>
                    <Link href="/recruiter" className="text-blue-400 hover:underline mt-2 inline-block">
                        Browse Candidates
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {candidates.map((item) => (
                        <div key={item.id} className="p-4 rounded-xl glass border border-white/5 hover:border-blue-500/30 transition flex flex-col md:flex-row items-center gap-4">
                            {/* Candidate Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold">
                                    {item.candidate.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{item.candidate.name}</h3>
                                    <p className="text-sm text-gray-400">{item.candidate.email}</p>
                                    <div className="flex gap-2 mt-1">
                                        {item.candidate.userSkills.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300">
                                                {skill.skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-4">
                                <select
                                    value={item.status}
                                    onChange={(e) => updateStatus(item.candidateId, e.target.value)}
                                    className="bg-gray-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    <option value="SAVED">Saved</option>
                                    <option value="CONTACTED">Contacted</option>
                                    <option value="INTERVIEWING">Interviewing</option>
                                    <option value="OFFERED">Offered</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>

                                <button title="View Notes" className="p-2 text-gray-400 hover:text-white transition">
                                    <MessageSquare className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => removeCandidate(item.candidateId)}
                                    title="Remove"
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



