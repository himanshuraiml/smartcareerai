'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Search, MoreVertical, Loader2, MessageSquare, Building2, Users } from "lucide-react";
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

function InstitutionMessagesContent() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const contactIdFromQuery = searchParams.get("contactId") || searchParams.get("candidateId");

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        if (user) fetchConversations();
    }, [user, fetchConversations]);

    // Auto-select or initialize conversation from query param
    useEffect(() => {
        const initializeChat = async () => {
            if (!contactIdFromQuery) return;

            const existingChat = conversations.find(c => c.id === contactIdFromQuery);
            if (existingChat) {
                setActiveChat(existingChat);
            } else if (!activeChat || activeChat.id !== contactIdFromQuery) {
                // Try to fetch user details (using university/students endpoint as a fallback for students)
                try {
                    let contactData = null;
                    // Try students first if it might be a student
                    const studentRes = await authFetch(`/university/students/${contactIdFromQuery}`);
                    if (studentRes.ok) {
                        const json = await studentRes.json();
                        contactData = json.data;
                    }

                    if (contactData) {
                        setActiveChat({
                            id: contactData.id,
                            name: contactData.name,
                            avatarUrl: contactData.avatarUrl,
                            lastMessage: "Start a new conversation",
                            lastMessageTime: new Date().toISOString(),
                            unreadCount: 0
                        });
                    } else {
                        // Fallback for recruiters or other users
                        setActiveChat({
                            id: contactIdFromQuery,
                            name: "New Contact",
                            lastMessage: "Start a new conversation",
                            lastMessageTime: new Date().toISOString(),
                            unreadCount: 0
                        });
                    }
                } catch (err) {
                    console.error("Failed to fetch contact for new chat:", err);
                }
            }
        };

        if (!loadingConversations) {
            initializeChat();
        }
    }, [contactIdFromQuery, conversations, activeChat, loadingConversations]);

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
        if (activeChat) fetchMessages(activeChat.id);
    }, [activeChat, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !activeChat || sending) return;

        const content = input.trim();
        setInput("");
        setSending(true);

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
                // Refresh conversations list to include the new one
                fetchConversations();
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
            <div className="w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-white/5">
                    <h2 className="text-xl font-black mb-4 px-2">Institution Inbox</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl pl-9 pr-4 py-2 text-sm focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 px-6 text-center">
                            <Building2 className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm font-bold">No active threads</p>
                            <p className="text-xs opacity-60 mt-1">Connect with regional recruiters or your industrial partners here.</p>
                        </div>
                    ) : (
                        conversations.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => {
                                    if (activeChat?.id === chat.id) {
                                        setActiveChat(null);
                                    } else {
                                        setActiveChat(chat);
                                    }
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 relative group ${activeChat?.id === chat.id
                                    ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20"
                                    : "bg-[#111827] border border-white/5 hover:border-amber-500/30 hover:bg-[#161d2f]"
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10">
                                    <span className="text-white font-bold">{chat.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-gray-900 dark:text-white truncate">{chat.name}</span>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate font-medium">{chat.lastMessage}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                                    <span className="text-white font-bold">{activeChat.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white leading-none mb-1">{activeChat.name}</h3>
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Industry Partner
                                    </span>
                                </div>
                            </div>
                            <button className="p-2.5 hover:bg-white dark:hover:bg-white/5 rounded-xl text-gray-500 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <p className="text-sm font-bold">No messages yet.</p>
                                    <p className="text-xs opacity-60">Start the conversation by sending a message below.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] rounded-3xl px-5 py-3 shadow-sm border ${isMe ? "bg-amber-600 text-white rounded-br-none border-amber-500" : "bg-white dark:bg-white/5 text-gray-900 dark:text-white rounded-bl-none border-gray-200 dark:border-white/10"
                                                }`}>
                                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                <span className={`text-[10px] font-bold mt-1.5 block opacity-60 ${isMe ? "text-amber-100" : ""}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-white/5">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3 bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/10">
                                <input
                                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..." className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
                                />
                                <button
                                    type="submit" disabled={!input.trim() || sending}
                                    className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
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
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Institutional Chat</h3>
                        <p className="max-w-[280px] text-center text-sm font-medium opacity-60 leading-relaxed">Collaborate with recruiters and partners regarding campus drives and placements.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function InstitutionMessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
            <InstitutionMessagesContent />
        </Suspense>
    );
}
