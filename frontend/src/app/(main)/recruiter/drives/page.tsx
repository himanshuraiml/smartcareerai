"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { GraduationCap, Calendar, Users, Plus, Briefcase, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";

interface Drive {
    id: string;
    name: string;
    description: string | null;
    status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
    startDate: string | null;
    endDate: string | null;
    institution: { id: string; name: string; logoUrl?: string | null };
    _count: { jobs: number; applications: number };
}

interface DriveJob {
    id: string;
    title: string;
    location: string;
    locationType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string;
    _count: { jobApplications: number };
}

const STATUS_COLORS: Record<string, string> = {
    UPCOMING: "bg-blue-900/30 text-blue-400 border border-blue-700/40",
    ONGOING: "bg-green-900/30 text-green-400 border border-green-700/40",
    COMPLETED: "bg-gray-700/30 text-gray-400 border border-gray-600/40",
    CANCELLED: "bg-red-900/30 text-red-400 border border-red-700/40",
};

const emptyForm = {
    title: "",
    description: "",
    requirements: "",
    requiredSkills: "",
    location: "",
    locationType: "onsite",
    salaryMin: "",
    salaryMax: "",
    applicationDeadline: "",
};

export default function RecruiterDrivesPage() {
    const [drives, setDrives] = useState<Drive[]>([]);
    const [loading, setLoading] = useState(true);

    // Per-drive job list (expanded)
    const [expandedDrive, setExpandedDrive] = useState<string | null>(null);
    const [driveJobs, setDriveJobs] = useState<Record<string, DriveJob[]>>({});
    const [jobsLoading, setJobsLoading] = useState<Record<string, boolean>>({});

    // Post job modal
    const [postingForDrive, setPostingForDrive] = useState<Drive | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        authFetch('/recruiter/drives')
            .then(r => r.json())
            .then(data => setDrives(data.data || []))
            .catch(() => {/* silent */})
            .finally(() => setLoading(false));
    }, []);

    const toggleJobs = async (driveId: string) => {
        if (expandedDrive === driveId) {
            setExpandedDrive(null);
            return;
        }
        setExpandedDrive(driveId);
        if (driveJobs[driveId]) return; // already loaded

        setJobsLoading(prev => ({ ...prev, [driveId]: true }));
        try {
            const res = await authFetch(`/recruiter/drives/${driveId}/jobs`);
            const data = await res.json();
            setDriveJobs(prev => ({ ...prev, [driveId]: data.data || [] }));
        } catch {
            toast.error('Failed to load jobs');
        } finally {
            setJobsLoading(prev => ({ ...prev, [driveId]: false }));
        }
    };

    const openPostModal = (drive: Drive) => {
        setPostingForDrive(drive);
        setForm(emptyForm);
    };

    const handlePost = async () => {
        if (!postingForDrive) return;
        if (!form.title || !form.description || !form.location) {
            toast.error('Title, description and location are required');
            return;
        }
        setSubmitting(true);
        try {
            const res = await authFetch(`/recruiter/drives/${postingForDrive.id}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
                    requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
                    location: form.location,
                    locationType: form.locationType,
                    salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
                    salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
                    applicationDeadline: form.applicationDeadline || undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed');
            }
            toast.success('Job posted for drive!');
            // Refresh drives count + job list
            setDrives(prev => prev.map(d =>
                d.id === postingForDrive.id
                    ? { ...d, _count: { ...d._count, jobs: d._count.jobs + 1 } }
                    : d
            ));
            // Invalidate cached job list so it reloads on next expand
            setDriveJobs(prev => { const next = { ...prev }; delete next[postingForDrive.id]; return next; });
            setPostingForDrive(null);
        } catch (e: any) {
            toast.error(e.message || 'Error posting job');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <GraduationCap className="w-7 h-7 text-blue-500" />
                    Campus Drives
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    View and manage placement drives at partner institutions
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
                </div>
            ) : drives.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-2xl">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No campus drives found</p>
                    <p className="text-xs text-gray-400 mt-1">Campus drives are created by institution admins. Contact your institution partners to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {drives.map(d => (
                        <div key={d.id} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{d.name}</h3>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[d.status]}`}>
                                                {d.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-500 font-semibold mb-2">{d.institution?.name}</p>
                                        {d.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{d.description}</p>
                                        )}
                                        <div className="flex gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" />
                                                {d._count.jobs} jobs posted
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {d._count.applications} applicants
                                            </span>
                                            {d.startDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(d.startDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {d.endDate && (
                                                <span className="flex items-center gap-1 text-gray-300">
                                                    → {new Date(d.endDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {(d.status === 'UPCOMING' || d.status === 'ONGOING') && (
                                            <button
                                                onClick={() => openPostModal(d)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Post Job
                                            </button>
                                        )}
                                        <button
                                            onClick={() => toggleJobs(d.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                                        >
                                            {expandedDrive === d.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            My Jobs
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded jobs list */}
                            {expandedDrive === d.id && (
                                <div className="border-t border-gray-100 dark:border-white/5 px-5 py-4 bg-gray-50 dark:bg-white/[0.02]">
                                    {jobsLoading[d.id] ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                        </div>
                                    ) : !driveJobs[d.id] || driveJobs[d.id].length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-3">
                                            No jobs posted yet for this drive.{' '}
                                            {(d.status === 'UPCOMING' || d.status === 'ONGOING') && (
                                                <button onClick={() => openPostModal(d)} className="text-blue-500 underline">Post one now.</button>
                                            )}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {driveJobs[d.id].map(job => (
                                                <div key={job.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-white/5">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {job.location} · {job.locationType}
                                                            {job.salaryMin && ` · ₹${job.salaryMin.toLocaleString()}`}
                                                            {job.salaryMax && `–${job.salaryMax.toLocaleString()}`}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {job._count.jobApplications} applied
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Post Job Modal */}
            {postingForDrive && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/5">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Post Job for Drive</h3>
                                <p className="text-xs text-blue-500 font-semibold mt-0.5">{postingForDrive.name} · {postingForDrive.institution.name}</p>
                            </div>
                            <button onClick={() => setPostingForDrive(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Job Title *', key: 'title', type: 'text', placeholder: 'e.g. Software Engineer' },
                                { label: 'Location *', key: 'location', type: 'text', placeholder: 'e.g. Bangalore' },
                            ].map(({ label, key, type, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                                    <input
                                        type={type}
                                        value={(form as any)[key]}
                                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Work Type</label>
                                <select
                                    value={form.locationType}
                                    onChange={e => setForm(prev => ({ ...prev, locationType: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="onsite">On-site</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description *</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    placeholder="Role overview, responsibilities..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Requirements (one per line)</label>
                                <textarea
                                    value={form.requirements}
                                    onChange={e => setForm(prev => ({ ...prev, requirements: e.target.value }))}
                                    rows={3}
                                    placeholder="B.Tech CS/IT&#10;Min 7 CGPA&#10;No active backlogs"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Required Skills (comma-separated)</label>
                                <input
                                    type="text"
                                    value={form.requiredSkills}
                                    onChange={e => setForm(prev => ({ ...prev, requiredSkills: e.target.value }))}
                                    placeholder="React, Node.js, TypeScript"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={form.salaryMin}
                                        onChange={e => setForm(prev => ({ ...prev, salaryMin: e.target.value }))}
                                        placeholder="400000"
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Max Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={form.salaryMax}
                                        onChange={e => setForm(prev => ({ ...prev, salaryMax: e.target.value }))}
                                        placeholder="800000"
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Application Deadline</label>
                                <input
                                    type="date"
                                    value={form.applicationDeadline}
                                    onChange={e => setForm(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setPostingForDrive(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Post Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
