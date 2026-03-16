"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Zap, Check, Loader2, ChevronDown } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface SequenceStep {
    delayHours: number;
    template: string;
}

interface Sequence {
    id: string;
    stageTrigger: string;
    steps: SequenceStep[];
    isActive: boolean;
    createdAt: string;
}

const STAGES = [
    { value: "APPLIED", label: "Applied" },
    { value: "SCREENING", label: "Screening" },
    { value: "INTERVIEWING", label: "Interviewing" },
    { value: "OFFER", label: "Offer Extended" },
    { value: "REJECTED", label: "Rejected" },
];

const DELAY_PRESETS = [
    { label: "Immediately", hours: 0 },
    { label: "1 hour", hours: 1 },
    { label: "1 day", hours: 24 },
    { label: "3 days", hours: 72 },
    { label: "1 week", hours: 168 },
];

function DelayLabel({ hours }: { hours: number }) {
    if (hours === 0) return <span>Immediately</span>;
    if (hours < 24) return <span>{hours}h delay</span>;
    if (hours === 24) return <span>1 day delay</span>;
    if (hours % 168 === 0) return <span>{hours / 168}w delay</span>;
    return <span>{Math.round(hours / 24)}d delay</span>;
}

interface Props {
    jobId: string;
}

export default function SequenceBuilder({ jobId }: Props) {
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [stageTrigger, setStageTrigger] = useState("SCREENING");
    const [steps, setSteps] = useState<SequenceStep[]>([
        { delayHours: 0, template: "Hi {{name}}, thanks for applying! We've received your application and will be in touch soon." },
    ]);
    const [isActive, setIsActive] = useState(true);

    const loadSequences = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/sequences`);
            if (res.ok) {
                const json = await res.json();
                setSequences(json.data || []);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [jobId]);

    useEffect(() => { loadSequences(); }, [loadSequences]);

    const addStep = () => {
        setSteps(prev => [...prev, { delayHours: 24, template: "Hi {{name}}, just following up on your application." }]);
    };

    const removeStep = (i: number) => {
        setSteps(prev => prev.filter((_, idx) => idx !== i));
    };

    const updateStep = (i: number, field: keyof SequenceStep, value: string | number) => {
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        if (steps.some(s => !s.template.trim())) return;
        setSaving(true);
        try {
            const res = await authFetch(`/recruiter/jobs/${jobId}/sequences`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stageTrigger, steps, isActive }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                loadSequences();
            }
        } catch { /* silent */ }
        finally { setSaving(false); }
    };

    const handleDelete = async (seqId: string) => {
        try {
            await authFetch(`/recruiter/jobs/${jobId}/sequences/${seqId}`, { method: "DELETE" });
            loadSequences();
        } catch { /* silent */ }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-amber-500" /> Create Automation
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically send messages when a candidate reaches a pipeline stage. Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{"{{name}}"}</code> for candidate's name.
                </p>
            </div>

            {/* Stage Trigger */}
            <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                    Trigger Stage
                </label>
                <div className="relative">
                    <select
                        value={stageTrigger}
                        onChange={e => setStageTrigger(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {STAGES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
                    Message Steps
                </label>
                {steps.map((step, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">Step {i + 1}</span>
                            {steps.length > 1 && (
                                <button
                                    onClick={() => removeStep(i)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {/* Delay */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1.5 block">Send after</label>
                            <div className="flex flex-wrap gap-1.5">
                                {DELAY_PRESETS.map(p => (
                                    <button
                                        key={p.hours}
                                        onClick={() => updateStep(i, 'delayHours', p.hours)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${step.delayHours === p.hours
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Template */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1.5 block">Message</label>
                            <textarea
                                value={step.template}
                                onChange={e => updateStep(i, 'template', e.target.value)}
                                rows={3}
                                placeholder={`Hi {{name}}, your application status has been updated...`}
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>
                    </div>
                ))}

                <button
                    onClick={addStep}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Add Step
                </button>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
                    <p className="text-xs text-gray-500">Sequence will fire when trigger stage is reached</p>
                </div>
                <button
                    onClick={() => setIsActive(v => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
            </div>

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving || steps.some(s => !s.template.trim())}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm transition-colors"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                {saved ? "Saved!" : saving ? "Saving..." : "Save Sequence"}
            </button>

            {/* Existing sequences */}
            {!loading && sequences.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Active Sequences</h4>
                    <div className="space-y-2">
                        {sequences.map(seq => (
                            <div key={seq.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${seq.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {STAGES.find(s => s.value === seq.stageTrigger)?.label || seq.stageTrigger}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 ml-4">
                                        {(seq.steps as SequenceStep[]).length} step{(seq.steps as SequenceStep[]).length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(seq.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
