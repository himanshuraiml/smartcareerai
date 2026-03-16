"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Send, Search, MoreVertical, Phone, Video, Loader2, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
}

interface Conversation {
    id: string;
    name: string;
    avatarUrl?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export default function CandidateMessagesPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations list
    const fetchConversations = useCallback(async () => {
        try {
            const res = await authFetch("/messages/conversations");
            if (res.ok) {
                const json = await res.json();
                setConversations(json.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user, fetchConversations]);

    // Fetch messages when chat is selected
    const fetchMessages = useCallback(async (contactId: string) => {
        setLoadingMessages(true);
        try {
            const res = await authFetch(`/messages?contactId=${contactId}`);
            if (res.ok) {
                const json = await res.json();
                setMessages(json.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);
        }
    }, [activeChat, fetchMessages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !activeChat || sending) return;

        const content = input.trim();
        setInput("");
        setSending(true);

        // Optimistic update
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            senderId: user?.id || "",
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await authFetch("/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: activeChat.id, content }),
            });

            if (res.ok) {
                const json = await res.json();
                setMessages(prev =>
                    prev.map(m => m.id === optimisticMsg.id ? json.data : m)
                );
            } else {
                setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
                setInput(content);
            }
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6">
            {/* Sidebar List */}
            <div className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-white/5">
                    <h2 className="text-xl font-black mb-4 px-2">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-gray-500 dark:text-gray-400 animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 px-6 text-center">
                            <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs opacity-60 mt-1">Recruiters who short-list you will contact you here.</p>
                        </div>
                    ) : (
                        conversations.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-l-4 ${activeChat?.id === chat.id ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500" : "border-transparent"}`}
                            >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/10">
                                    <span className="text-white font-bold">{chat.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-gray-900 dark:text-white truncate">{chat.name}</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400">
                                            {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium">{chat.lastMessage}</p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">{chat.unreadCount}</span>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                    <span className="text-white font-bold">{activeChat.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white leading-none mb-1">{activeChat.name}</h3>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Recruiter
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 hover:bg-white dark:hover:bg-white/5 rounded-xl text-gray-500 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                    <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    const isBot = msg.content.startsWith("[AI Assistant]:");

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] rounded-3xl px-5 py-3 shadow-sm border ${isMe
                                                    ? "bg-blue-600 text-white rounded-br-none border-blue-500 font-medium"
                                                    : isBot
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-bl-none border-indigo-100 dark:border-indigo-500/20 italic font-medium"
                                                        : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-bl-none border-gray-200 dark:border-white/10 font-medium"
                                                }`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <span className={`text-[10px] font-bold mt-1.5 block opacity-60 ${isMe ? "text-blue-100" : ""}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200 dark:border-white/5">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-3 bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/10"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]">
                        <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-gray-100 dark:border-white/10">
                            <MessageSquare className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Your Inbox</h3>
                        <p className="max-w-[280px] text-center text-sm font-medium opacity-60 leading-relaxed">Select a conversation to communicate with recruiters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
