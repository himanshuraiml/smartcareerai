'use client';

import { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface MotivationQuote {
    text: string;
    author: string;
}

export default function DailyMotivation() {
    const [quote, setQuote] = useState<MotivationQuote | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/motivation`);
                if (res.ok) {
                    const data = await res.json();
                    // The API returns { success: true, data: { text: "...", author: "..." } }
                    setQuote(data.data);
                } else {
                    console.error('Motivation fetch failed:', res.status, res.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch motivation', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuote();
    }, []);

    if (loading) {
        return (
            <div className="p-4 rounded-xl glass-card border border-white/5 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-3/4"></div>
                        <div className="h-2 bg-white/10 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!quote) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl glass-card border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden group cursor-default"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Quote className="w-16 h-16 text-indigo-400 rotate-12" />
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                        Daily Motivation
                    </h4>
                    <p className="text-sm text-gray-200 italic leading-relaxed mb-3 font-serif">
                        "{quote.text}"
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="h-px w-4 bg-indigo-500/30"></div>
                        <p className="text-xs text-gray-400 font-medium">
                            {quote.author}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


