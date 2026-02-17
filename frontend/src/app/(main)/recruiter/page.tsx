"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    MapPin,
    Briefcase,
    Award,
    Bookmark,
    Check,
    Filter
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface Candidate {
    id: string;
    name: string;
    avatarUrl?: string;
    skills: Array<{ name: string; level: string; verified: boolean }>;
    latestScore?: { overallScore: number; jobRole: string };
    badges: Array<{ skill: string; type: string }>;
}

export default function CandidateSearchPage() {
    const { user } = useAuthStore();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [skills, setSkills] = useState("");
    const [location, setLocation] = useState("");
    const [experienceMin, setExperienceMin] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (skills) params.append("skills", skills);
            if (location) params.append("location", location);
            if (experienceMin) params.append("experienceMin", experienceMin);

            const response = await authFetch(`/recruiter/candidates/search?${params}`);

            if (response.ok) {
                const data = await response.json();
                setCandidates(data.data);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    }, [user, skills, location, experienceMin]);

    // Initial load
    useEffect(() => {
        if (user) {
            fetchCandidates();
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCandidates();
    };

    const handleSaveCandidate = async (candidateId: string) => {
        try {
            const response = await authFetch(`/recruiter/candidates/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ candidateId })
            });

            if (response.ok) {
                // Show success toast or update UI state
                alert("Candidate saved!");
            }
        } catch (error) {
            console.error("Failed to save candidate", error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Find Candidates</h1>
                <p className="text-gray-400 mt-1">Search for top talent based on skills and performance</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by skills (e.g. React, Node.js)..."
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2 transition ${showFilters ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                    <Filter className="w-5 h-5" />
                    Filters
                </button>
                <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                >
                    Search
                </button>
            </form>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="p-4 rounded-xl glass border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="City or Country"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900/50 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Min Experience (Years)</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                placeholder="0"
                                value={experienceMin}
                                onChange={(e) => setExperienceMin(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900/50 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : candidates.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No candidates found matching your criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map((candidate) => (
                        <div key={candidate.id} className="group p-6 rounded-xl glass border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1 duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{candidate.name}</h3>
                                        {candidate.latestScore && (
                                            <p className="text-sm text-gray-400">{candidate.latestScore.jobRole}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSaveCandidate(candidate.id)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                                    title="Save Candidate"
                                >
                                    <Bookmark className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-white/5">
                                <div className="flex-1 text-center border-r border-white/10">
                                    <p className="text-xs text-gray-400">ATS Score</p>
                                    <p className="text-lg font-bold text-green-400">{candidate.latestScore?.overallScore || '--'}%</p>
                                </div>
                                <div className="flex-1 text-center">
                                    <p className="text-xs text-gray-400">Badges</p>
                                    <p className="text-lg font-bold text-yellow-400">{candidate.badges.length}</p>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Top Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.skills.slice(0, 5).map((skill, i) => (
                                        <span
                                            key={i}
                                            className={`px-2 py-1 rounded-md text-xs font-medium border ${skill.verified
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-white/5 text-gray-400 border-transparent'
                                                }`}
                                        >
                                            {skill.name}
                                            {skill.verified && <Check className="w-3 h-3 inline ml-1" />}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full mt-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition">
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



