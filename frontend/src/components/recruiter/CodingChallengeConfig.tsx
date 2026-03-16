"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Code2, Search, Filter, CheckCircle2, X, ChevronRight,
    Terminal, Cpu, Binary, Brain, AlertCircle, Loader2,
    Plus, FileCode, Trash2, Globe, Lock, AlignLeft
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "@/store/auth.store";

interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
    tags: string[];
}

interface Props {
    onClose: () => void;
    onSave: (challengeIds: string[]) => void;
    initialSelected?: string[];
}

export default function CodingChallengeConfig({ onClose, onSave, initialSelected = [] }: Props) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState<string>("ALL");
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
    const [activeTab, setActiveTab] = useState<"BANK" | "CREATE">("BANK");
    const [saving, setSaving] = useState(false);

    // Custom form state
    const [customForm, setCustomForm] = useState({
        title: "",
        description: "",
        difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
        category: "algorithms",
        tags: [] as string[],
        languages: ["python", "javascript"],
        starterCode: {
            python: "# Write your code here\ndef solution():\n    pass",
            javascript: "// Write your code here\nfunction solution() {\n    \n}"
        } as Record<string, string>,
        testCases: [
            { input: "", expectedOutput: "", isHidden: false }
        ]
    });

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const { user } = useAuthStore.getState();
                const res = await authFetch(`/coding/challenges`, {
                    headers: {
                        'x-recruiter-id': user?.id || '',
                        'x-organization-id': user?.institutionId || ''
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setChallenges(data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch challenges:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, []);

    const filtered = challenges.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase());
        const matchesDiff = difficulty === "ALL" || c.difficulty === difficulty;
        return matchesSearch && matchesDiff;
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        onSave(selectedIds);
        onClose();
    };

    const handleCreateCustom = async () => {
        if (!customForm.title || !customForm.description) return;

        setSaving(true);
        try {
            const res = await authFetch(`/coding/challenges/custom`, {
                method: "POST",
                body: JSON.stringify(customForm)
            });

            if (res.ok) {
                const result = await res.json();
                const newChallenge = result.data;

                // Add to list and select it
                setChallenges(prev => [newChallenge, ...prev]);
                setSelectedIds(prev => [...prev, newChallenge.id]);

                // Reset and switch back
                setActiveTab("BANK");
                setCustomForm({
                    title: "",
                    description: "",
                    difficulty: "MEDIUM",
                    category: "algorithms",
                    tags: [],
                    languages: ["python", "javascript"],
                    starterCode: {
                        python: "# Write your code here\ndef solution():\n    pass",
                        javascript: "// Write your code here\nfunction solution() {\n    \n}"
                    },
                    testCases: [{ input: "", expectedOutput: "", isHidden: false }]
                });
            }
        } catch (err) {
            console.error("Failed to create custom challenge:", err);
        } finally {
            setSaving(false);
        }
    };

    const addTestCase = () => {
        setCustomForm(prev => ({
            ...prev,
            testCases: [...prev.testCases, { input: "", expectedOutput: "", isHidden: false }]
        }));
    };

    const removeTestCase = (index: number) => {
        setCustomForm(prev => ({
            ...prev,
            testCases: prev.testCases.filter((_, i) => i !== index)
        }));
    };

    const updateTestCase = (index: number, field: string, value: any) => {
        setCustomForm(prev => ({
            ...prev,
            testCases: prev.testCases.map((tc, i) => i === index ? { ...tc, [field]: value } : tc)
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-[#111827] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-white/5"
            >
                {/* Header */}
                <div className="px-6 pt-5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Coding Challenges</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure technical assessment for this stage</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-4 border-b border-gray-100 dark:border-white/5">
                        <button
                            onClick={() => setActiveTab("BANK")}
                            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === "BANK" ? "text-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Challenge Bank
                            {activeTab === "BANK" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("CREATE")}
                            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === "CREATE" ? "text-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Create Your Own
                            {activeTab === "CREATE" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === "BANK" ? (
                        <div className="p-6 space-y-6">
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search challenges..."
                                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {["ALL", "EASY", "MEDIUM", "HARD"].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${difficulty === d
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-emerald-500/50"
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    <p className="text-sm font-medium">Fetching challenges pool...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-20 opacity-40">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-sm font-medium">No challenges match your filters</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filtered.map(challenge => {
                                        const isSelected = selectedIds.includes(challenge.id);
                                        return (
                                            <button
                                                key={challenge.id}
                                                onClick={() => toggleSelect(challenge.id)}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden ${isSelected
                                                    ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5 shadow-sm"
                                                    : "border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01] hover:border-emerald-200"
                                                    }`}
                                            >
                                                <div className="flex flex-col h-full gap-3 relative z-10">
                                                    <div className="flex items-center justify-between">
                                                        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase border ${challenge.difficulty === 'HARD' ? 'text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-500/10' :
                                                            challenge.difficulty === 'MEDIUM' ? 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-500/10' :
                                                                'text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10'
                                                            }`}>
                                                            {challenge.difficulty}
                                                        </div>
                                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1">{challenge.title}</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                            {challenge.description}
                                                        </p>
                                                    </div>
                                                    <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
                                                        {challenge.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-[10px] bg-white dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/5 text-gray-400 font-bold uppercase transition-colors group-hover:border-emerald-500/20">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Terminal className={`absolute -bottom-2 -right-2 w-16 h-16 transition-opacity ${isSelected ? 'opacity-10' : 'opacity-[0.02]'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Title & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <FileCode className="w-3 h-3 text-emerald-500" /> Challenge Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Reverse a Linked List"
                                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        value={customForm.title}
                                        onChange={e => setCustomForm(p => ({ ...p, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Filter className="w-3 h-3 text-emerald-500" /> Difficulty & Category
                                    </label>
                                    <div className="flex gap-3">
                                        <select
                                            className="flex-1 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            value={customForm.difficulty}
                                            onChange={e => setCustomForm(p => ({ ...p, difficulty: e.target.value as any }))}
                                        >
                                            <option value="EASY">Easy</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HARD">Hard</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Category (e.g. Strings)"
                                            className="flex-1 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            value={customForm.category}
                                            onChange={e => setCustomForm(p => ({ ...p, category: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <AlignLeft className="w-3 h-3 text-emerald-500" /> Problem Description
                                </label>
                                <textarea
                                    placeholder="Describe the problem, input format, and expected output clearly..."
                                    rows={4}
                                    className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                                    value={customForm.description}
                                    onChange={e => setCustomForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>

                            {/* Starter Code */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Terminal className="w-3 h-3 text-emerald-500" /> Starter Code (Python)
                                </label>
                                <textarea
                                    placeholder="def solution():\n    # Your code here"
                                    rows={6}
                                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                                    value={customForm.starterCode.python}
                                    onChange={e => setCustomForm(p => ({
                                        ...p,
                                        starterCode: { ...p.starterCode, python: e.target.value }
                                    }))}
                                />
                            </div>

                            {/* Test Cases */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Evaluation Test Cases
                                    </label>
                                    <button
                                        onClick={addTestCase}
                                        className="text-[10px] font-black uppercase px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5"
                                    >
                                        <Plus className="w-3 h-3" /> Add Test Case
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {customForm.testCases.map((tc, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Case #{idx + 1}</span>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateTestCase(idx, 'isHidden', !tc.isHidden)}
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${tc.isHidden ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-500/10 text-gray-500'}`}
                                                    >
                                                        {tc.isHidden ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                                        <span className="text-[10px] font-bold uppercase">{tc.isHidden ? 'Hidden' : 'Public'}</span>
                                                    </button>
                                                    {customForm.testCases.length > 1 && (
                                                        <button onClick={() => removeTestCase(idx)} className="p-1 text-gray-400 hover:text-rose-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Input</span>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. [1, 2, 3]"
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        value={tc.input}
                                                        onChange={e => updateTestCase(idx, 'input', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Expected Output</span>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. [3, 2, 1]"
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        value={tc.expectedOutput}
                                                        onChange={e => updateTestCase(idx, 'expectedOutput', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="text-sm font-bold text-gray-500">
                        {activeTab === "BANK" ? (
                            `${selectedIds.length} ${selectedIds.length === 1 ? 'Challenge' : 'Challenges'} Selected`
                        ) : (
                            'Define challenge details and test cases'
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            Cancel
                        </button>
                        {activeTab === "BANK" ? (
                            <button
                                onClick={handleSave}
                                disabled={selectedIds.length === 0}
                                className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                Save Selection
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateCustom}
                                disabled={saving || !customForm.title || !customForm.description || customForm.testCases.some(tc => !tc.input || !tc.expectedOutput)}
                                className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Create & Select
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
