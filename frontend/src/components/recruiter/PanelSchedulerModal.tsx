'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface TeamMember {
    id: string;
    name: string;
    email: string;
}

interface PanelSchedulerModalProps {
    applicationId: string;
    candidateName: string;
    onClose: () => void;
    onCreated: (panel: any) => void;
}

export default function PanelSchedulerModal({
    applicationId,
    candidateName,
    onClose,
    onCreated,
}: PanelSchedulerModalProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [scheduledAt, setScheduledAt] = useState('');
    const [durationMins, setDurationMins] = useState(60);
    const [meetLink, setMeetLink] = useState('');

    useEffect(() => {
        authFetch('/organization/my/members')
            .then(r => r.json())
            .then(d => setTeamMembers(d.data || []))
            .catch(() => {/* silent */});
    }, []);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleInterviewer = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            setError('Select at least one interviewer.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await authFetch(`/recruiter/applications/${applicationId}/panel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewerIds: selectedIds,
                    scheduledAt: scheduledAt || undefined,
                    durationMins,
                    meetLink: meetLink || undefined,
                    notes: notes || undefined,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to create panel');
            onCreated(data.data);
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Schedule Panel Interview
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{candidateName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Interviewer selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Interviewers <span className="text-red-500">*</span>
                        </label>
                        {teamMembers.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No team members found.</p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                {teamMembers.map((m) => (
                                    <label
                                        key={m.id}
                                        className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(m.id)}
                                            onChange={() => toggleInterviewer(m.id)}
                                            className="rounded border-gray-300 text-blue-600"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {m.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{m.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                        {selectedIds.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                                {selectedIds.length} interviewer{selectedIds.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>

                    {/* Schedule date/time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duration (mins)
                            </label>
                            <select
                                value={durationMins}
                                onChange={(e) => setDurationMins(Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {[30, 45, 60, 90, 120].map((d) => (
                                    <option key={d} value={d}>{d} min</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Meet link */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Meeting Link (optional)
                        </label>
                        <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            value={meetLink}
                            onChange={(e) => setMeetLink(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes (optional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Focus areas, context for interviewers..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedIds.length === 0}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Scheduling...' : 'Schedule Panel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
