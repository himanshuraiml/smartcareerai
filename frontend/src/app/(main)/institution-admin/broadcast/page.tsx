"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Send, Users, Mail, MessageSquare, Bell, Clock,
    CheckCircle2, AlertCircle, History, Filter, Search
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "@/store/auth.store";

interface BroadcastHistory {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    user: { name: string; email: string };
}

export default function BroadcastHub() {
    const { user } = useAuthStore();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [targetGroup, setTargetGroup] = useState("ALL");
    const [channels, setChannels] = useState(["IN_APP", "EMAIL"]);
    const [history, setHistory] = useState<BroadcastHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await authFetch("/university/broadcast/history");
            if (res.ok) {
                const data = await res.json();
                setHistory(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authFetch("/university/broadcast", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    message,
                    targetGroup,
                    channels
                })
            });

            if (res.ok) {
                setSent(true);
                setTitle("");
                setMessage("");
                fetchHistory();
                setTimeout(() => setSent(false), 3000);
            }
        } catch (error) {
            console.error("Broadcast failed", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleChannel = (channel: string) => {
        if (channels.includes(channel)) {
            setChannels(channels.filter(c => c !== channel));
        } else {
            setChannels([...channels, channel]);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <Send className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Broadcast Hub</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">Multi-channel communication with students and faculty.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compose Section */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass border border-gray-200 dark:border-white/5 rounded-3xl p-8"
                    >
                        <form onSubmit={handleSend} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Broadcast Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Mandatory Placement Orientation - 2026 Batch"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Target Group</label>
                                    <select
                                        value={targetGroup}
                                        onChange={(e) => setTargetGroup(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value="ALL">All Users</option>
                                        <option value="STUDENTS">Students Only</option>
                                        <option value="FACULTY">Faculty/Admins Only</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Urgency Level</label>
                                    <select className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none">
                                        <option>Normal</option>
                                        <option>High (Red alert)</option>
                                        <option>Critical (SMS priority)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Message Content</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    rows={6}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Delivery Channels</label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { id: "IN_APP", icon: Bell, label: "In-App" },
                                        { id: "EMAIL", icon: Mail, label: "Email" },
                                        { id: "WHATSAPP", icon: MessageSquare, label: "WhatsApp" },
                                        { id: "PUSH", icon: Send, label: "Push Notif" }
                                    ].map(ch => (
                                        <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => toggleChannel(ch.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all truncate
                                                ${channels.includes(ch.id)
                                                    ? 'bg-violet-500/10 border-violet-500 text-violet-600 dark:text-violet-400'
                                                    : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300'}
                                            `}
                                        >
                                            <ch.icon className="w-4 h-4" />
                                            <span className="text-xs font-bold">{ch.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Estimated reach: 1,240 recipients
                                </p>
                                <button
                                    disabled={loading || !title || !message}
                                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/25 flex items-center gap-2 disabled:opacity-50 transition transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? "Sending..." : sent ? "Broadcast Sent!" : "Execute Broadcast"}
                                    {sent ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Sidebar History */}
                <div className="space-y-6">
                    <div className="glass border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex flex-col h-full max-h-[700px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-fuchsia-500" />
                                Recent Broadcasts
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {history.length > 0 ? history.map(item => (
                                <div key={item.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-violet-500/30 transition group">
                                    <div className="flex items-start justify-between">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-500 transition-colors line-clamp-1">{item.title}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{item.message}</p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex -space-x-1">
                                            <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center border border-white dark:border-gray-800">
                                                <Mail className="w-2.5 h-2.5 text-violet-600" />
                                            </div>
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-white dark:border-gray-800">
                                                <Bell className="w-2.5 h-2.5 text-emerald-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <History className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No broadcasts yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
