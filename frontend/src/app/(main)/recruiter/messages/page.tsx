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

export default function MessagesPage() {
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
                // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetching
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
                // Replace optimistic message with server response
                setMessages(prev =>
                    prev.map(m => m.id === optimisticMsg.id ? json.data : m)
                );
            } else {
                // Remove optimistic message on failure
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
        <div className="h-[calc(100vh-120px)] flex gap-6">
            {/* Sidebar List */}
            <div className="w-80 glass rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                            <p className="text-sm">No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left ${activeChat?.id === chat.id ? "bg-white/5 border-l-2 border-blue-500" : ""}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-medium">{chat.name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-medium text-white truncate">{chat.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                        <span className="text-xs font-bold text-white">{chat.unreadCount}</span>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass rounded-xl flex flex-col overflow-hidden">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <span className="text-white font-medium">{activeChat.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{activeChat.name}</h3>
                                    <span className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        Online
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                                    <Video className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <p className="text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe
                                                ? "bg-blue-600 text-white rounded-br-sm"
                                                : "bg-white/10 text-white rounded-bl-sm"
                                                }`}>
                                                <p>{msg.content}</p>
                                                <span className={`text-xs mt-1 block ${isMe ? "text-blue-200" : "text-gray-400"}`}>
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
                        <div className="p-4 border-t border-white/5">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}
