"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Search, MoreVertical, Phone, Video, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
}

interface Conversation {
    id: string; // User ID of contact
    name: string;
    avatarUrl?: string; // Add this line
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

export default function MessagesPage() {
    const { accessToken, user } = useAuthStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations on load
    useEffect(() => {
        if (!accessToken) return;

        // Mock data for initial render until backend connects
        const mockConversations = [
            {
                id: "user1",
                name: "Alex Johnson",
                lastMessage: "Thanks for reaching out!",
                lastMessageTime: new Date().toISOString(),
                unreadCount: 2
            },
            {
                id: "user2",
                name: "Maria Garcia",
                lastMessage: "I am available for an interview tomorrow.",
                lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
                unreadCount: 0
            }
        ];

        // In real app: fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/messages/conversations`)
        setConversations(mockConversations);
        setLoading(false);
    }, [accessToken]);

    // Fetch messages when chat is selected
    useEffect(() => {
        if (!activeChat) return;

        // Mock messages
        setMessages([
            {
                id: "1",
                senderId: user?.id || "",
                content: "Hi " + activeChat.name + ", I reviewed your profile and I'm impressed.",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                isRead: true
            },
            {
                id: "2",
                senderId: activeChat.id,
                content: activeChat.lastMessage,
                createdAt: activeChat.lastMessageTime,
                isRead: true
            }
        ]);
    }, [activeChat, user]);

    const handleSend = () => {
        if (!input.trim() || !activeChat) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: user?.id || "",
            content: input,
            createdAt: new Date().toISOString(),
            isRead: false
        };

        setMessages([...messages, newMessage]);
        setInput("");
        // In real app: POST /api/v1/messages
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
                    {conversations.map(chat => (
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
                                    <span className="text-xs text-gray-500">12:30 PM</span>
                                </div>
                                <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{chat.unreadCount}</span>
                                </div>
                            )}
                        </button>
                    ))}
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
                            {messages.map((msg) => {
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
                            })}
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
                                    disabled={!input.trim()}
                                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
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
