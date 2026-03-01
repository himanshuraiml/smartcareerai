'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage } from './useMeetingSocket';

export function useMeetingChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelOpenRef = useRef(false);

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
        if (!panelOpenRef.current) {
            setUnreadCount((n) => n + 1);
        }
    }, []);

    const markRead = useCallback(() => {
        setUnreadCount(0);
        panelOpenRef.current = true;
    }, []);

    const markClosed = useCallback(() => {
        panelOpenRef.current = false;
    }, []);

    // Keep panelOpenRef in sync — not tracked via state to avoid re-renders
    useEffect(() => {
        return () => {
            panelOpenRef.current = false;
        };
    }, []);

    return { messages, unreadCount, addMessage, markRead, markClosed };
}
