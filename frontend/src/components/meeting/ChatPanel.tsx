'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useMeetingSocket';

interface ChatPanelProps {
    messages: ChatMessage[];
    currentUserId: string;
    onSendMessage: (content: string) => void;
    onClose: () => void;
}

export function ChatPanel({ messages, currentUserId, onSendMessage, onClose }: ChatPanelProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-white">Chat</h3>
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => {
                    const isOwn = msg.userId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                                isOwn
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-800 text-gray-200'
                            }`}>
                                {!isOwn && (
                                    <p className="text-xs text-gray-400 mb-1">{msg.userId.slice(0, 8)}</p>
                                )}
                                <p>{msg.content}</p>
                                <p className="text-xs opacity-60 mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
