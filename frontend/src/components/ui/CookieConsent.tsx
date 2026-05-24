'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'cookie_consent';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    }, []);

    const accept = () => { localStorage.setItem(STORAGE_KEY, 'accepted'); setVisible(false); };
    const decline = () => { localStorage.setItem(STORAGE_KEY, 'declined'); setVisible(false); };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0F19] shadow-2xl shadow-black/20 px-5 py-4">
                <Cookie className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="flex-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We use cookies to improve your experience and analyse site usage.{' '}
                    <Link href="/privacy" className="text-blue-500 hover:underline font-medium">Privacy Policy</Link>.
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={decline}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border border-gray-200 dark:border-white/10"
                    >
                        Decline
                    </button>
                    <button
                        onClick={accept}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
                    >
                        Accept
                    </button>
                    <button onClick={decline} aria-label="Dismiss" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
