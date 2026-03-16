"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plug,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    RefreshCw,
    Send,
    ChevronDown,
    ChevronUp,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    X,
    AlertCircle,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

const PROVIDERS = ["WORKDAY", "SAP", "ZOHO", "KEKA", "GENERIC"] as const;
type Provider = typeof PROVIDERS[number];

const PLACENXT_FIELDS = [
    { key: "candidateName", label: "Candidate Name" },
    { key: "email", label: "Email" },
    { key: "applicationId", label: "Application ID" },
    { key: "jobTitle", label: "Job Title" },
    { key: "status", label: "Application Status" },
    { key: "appliedAt", label: "Applied At" },
    { key: "score", label: "ATS Score" },
];

const PROVIDER_COLORS: Record<Provider, string> = {
    WORKDAY: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    SAP: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    ZOHO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    KEKA: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    GENERIC: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

interface AtsConfig {
    id: string;
    provider: Provider;
    outboundUrl?: string;
    fieldMappings: Record<string, string>;
    lastSyncAt?: string;
    isActive: boolean;
}

interface WebhookLog {
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    status: "SUCCESS" | "FAILED";
    payload: any;
    createdAt: string;
    error?: string;
}

export default function IntegrationsPage() {
    const [configs, setConfigs] = useState<AtsConfig[]>([]);
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [orgId, setOrgId] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AtsConfig | null>(null);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        provider: "GENERIC" as Provider,
        outboundUrl: "",
        apiKey: "",
        fieldMappings: {} as Record<string, string>,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchOrg();
    }, []);

    useEffect(() => {
        if (orgId) {
            fetchConfigs();
        }
    }, [orgId]);

    async function fetchOrg() {
        try {
            const res = await authFetch("/organization/my");
            if (res.ok) {
                const data = await res.json();
                setOrgId(data.data?.id || "");
            }
        } catch {}
    }

    async function fetchConfigs() {
        setLoading(true);
        try {
            const res = await authFetch(`/organization/${orgId}/integrations/ats`);
            if (res.ok) {
                const data = await res.json();
                setConfigs(data.data || []);
            }
        } catch {}
        setLoading(false);
    }

    function openAddModal() {
        setEditingConfig(null);
        setForm({ provider: "GENERIC", outboundUrl: "", apiKey: "", fieldMappings: {} });
        setShowModal(true);
    }

    function openEditModal(config: AtsConfig) {
        setEditingConfig(config);
        setForm({
            provider: config.provider,
            outboundUrl: config.outboundUrl || "",
            apiKey: "",
            fieldMappings: { ...config.fieldMappings },
        });
        setShowModal(true);
    }

    async function saveConfig() {
        if (!orgId) return;
        setSaving(true);
        try {
            const res = await authFetch(`/organization/${orgId}/integrations/ats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: form.provider,
                    outboundUrl: form.outboundUrl || undefined,
                    apiKey: form.apiKey || undefined,
                    fieldMappings: form.fieldMappings,
                }),
            });
            if (res.ok) {
                await fetchConfigs();
                setShowModal(false);
            }
        } catch {}
        setSaving(false);
    }

    async function deleteConfig(configId: string) {
        if (!orgId) return;
        setDeletingId(configId);
        try {
            await authFetch(`/organization/${orgId}/integrations/ats/${configId}`, { method: "DELETE" });
            setConfigs(prev => prev.filter(c => c.id !== configId));
        } catch {}
        setDeletingId(null);
    }

    async function testWebhook(configId: string) {
        if (!orgId) return;
        setTestingId(configId);
        try {
            await authFetch(`/organization/${orgId}/integrations/ats/${configId}/test`, { method: "POST" });
        } catch {}
        setTestingId(null);
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Connect PlaceNxt with your ATS for bidirectional candidate sync.
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Integration
                </button>
            </div>

            {/* Integrations List */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">ATS Connections</h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                ) : configs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                        <Plug className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No integrations configured</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add an ATS connection to start syncing candidates</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {configs.map(config => (
                            <motion.div
                                key={config.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                            <Plug className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${PROVIDER_COLORS[config.provider] || PROVIDER_COLORS.GENERIC}`}>
                                                    {config.provider}
                                                </span>
                                                {config.isActive ? (
                                                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                                                        <XCircle className="w-3 h-3" /> Inactive
                                                    </span>
                                                )}
                                            </div>
                                            {config.outboundUrl && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-xs">
                                                    {config.outboundUrl}
                                                </p>
                                            )}
                                            {config.lastSyncAt && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Last sync: {new Date(config.lastSyncAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => testWebhook(config.id)}
                                            disabled={testingId === config.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {testingId === config.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                            Test
                                        </button>
                                        <button
                                            onClick={() => openEditModal(config)}
                                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteConfig(config.id)}
                                            disabled={deletingId === config.id}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {deletingId === config.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Field Mappings Preview */}
                                {Object.keys(config.fieldMappings || {}).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Field Mappings</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(config.fieldMappings).map(([pn, ats]) => (
                                                <span key={pn} className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-gray-600 dark:text-gray-400">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{pn}</span>
                                                    <span className="mx-1 text-gray-400">→</span>
                                                    {ats}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Webhook Logs */}
            {logs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Recent Webhook Activity</h2>
                    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Direction</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <>
                                        <tr key={log.id} className="border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                            <td className="px-4 py-3">
                                                <span className={`flex items-center gap-1.5 text-xs font-semibold ${log.direction === "OUTBOUND" ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"}`}>
                                                    {log.direction === "OUTBOUND" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                    {log.direction}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`flex items-center gap-1 text-xs font-semibold ${log.status === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                    {log.status === "SUCCESS" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                                    {expandedLog === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedLog === log.id && (
                                            <tr key={`${log.id}-expanded`} className="bg-gray-50 dark:bg-white/[0.02]">
                                                <td colSpan={4} className="px-4 py-3">
                                                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-40">
                                                        {JSON.stringify(log.payload, null, 2)}
                                                    </pre>
                                                    {log.error && (
                                                        <p className="flex items-center gap-1 text-xs text-rose-500 mt-2">
                                                            <AlertCircle className="w-3 h-3" /> {log.error}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#0F1424] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.06]">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingConfig ? "Edit Integration" : "Add ATS Integration"}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                                {/* Provider */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">ATS Provider</label>
                                    <select
                                        value={form.provider}
                                        onChange={e => setForm(f => ({ ...f, provider: e.target.value as Provider }))}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                {/* Outbound URL */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Outbound Webhook URL</label>
                                    <input
                                        type="url"
                                        value={form.outboundUrl}
                                        onChange={e => setForm(f => ({ ...f, outboundUrl: e.target.value }))}
                                        placeholder="https://your-ats.com/webhooks/placenxt"
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* API Key */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">API Key (optional)</label>
                                    <input
                                        type="password"
                                        value={form.apiKey}
                                        onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                                        placeholder={editingConfig ? "Leave blank to keep existing" : "Enter API key"}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Field Mappings */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Field Mappings</label>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Map PlaceNxt fields to your ATS field names.</p>
                                    <div className="space-y-2">
                                        {PLACENXT_FIELDS.map(field => (
                                            <div key={field.key} className="flex items-center gap-3">
                                                <div className="w-36 shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg px-2.5 py-2">
                                                    {field.label}
                                                </div>
                                                <span className="text-gray-300 dark:text-gray-600 text-sm">→</span>
                                                <input
                                                    type="text"
                                                    value={form.fieldMappings[field.key] || ""}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setForm(f => ({
                                                            ...f,
                                                            fieldMappings: val
                                                                ? { ...f.fieldMappings, [field.key]: val }
                                                                : Object.fromEntries(Object.entries(f.fieldMappings).filter(([k]) => k !== field.key)),
                                                        }));
                                                    }}
                                                    placeholder={`ATS field name`}
                                                    className="flex-1 px-2.5 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-white/[0.06]">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={saveConfig}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingConfig ? "Update" : "Save Integration"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
