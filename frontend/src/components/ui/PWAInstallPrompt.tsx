'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Download, Share, Plus } from 'lucide-react';

const DISMISSED_KEY = 'pwa_install_dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS() {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function wasDismissedRecently() {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY);
        if (!raw) return false;
        return Date.now() - Number(raw) < DISMISS_TTL_MS;
    } catch {
        return false;
    }
}

function saveDismissed() {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch { /* ignore */ }
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showIOSBanner, setShowIOSBanner] = useState(false);
    const [visible, setVisible] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        if (isInStandaloneMode() || wasDismissedRecently()) return;

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {/* silent */});
        }

        // iOS: no beforeinstallprompt — show manual instructions
        if (isIOS()) {
            setShowIOSBanner(true);
            setVisible(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setInstalled(true);
            setVisible(false);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const dismiss = () => {
        saveDismissed();
        setVisible(false);
    };

    const install = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setInstalled(true);
        setVisible(false);
        setDeferredPrompt(null);
    };

    if (!visible || installed) return null;

    return (
        <div
            role="dialog"
            aria-label="Install PlaceNxt app"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm
                       sm:left-auto sm:right-5 sm:translate-x-0 sm:max-w-xs
                       animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
            <div className="relative rounded-2xl border border-white/10 bg-[#0B0F19] shadow-2xl shadow-black/40 overflow-hidden">
                {/* Blue accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-[#1E2840] border border-white/10">
                            <Image
                                src="/logo-new.png"
                                alt="PlaceNxt"
                                fill
                                className="object-contain p-1"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight">PlaceNxt</p>
                            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                                {showIOSBanner
                                    ? 'Add to your Home Screen for quick access'
                                    : 'Install for faster access — works offline'}
                            </p>
                        </div>
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss"
                            className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* iOS instructions */}
                    {showIOSBanner ? (
                        <div className="mt-3 rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                <Share className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <span>Tap the <span className="font-semibold text-white">Share</span> button in Safari</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                <Plus className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                <span>Select <span className="font-semibold text-white">Add to Home Screen</span></span>
                            </div>
                        </div>
                    ) : (
                        /* Install button for Chrome/Edge/Android */
                        <button
                            onClick={install}
                            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-colors shadow-lg shadow-blue-500/25"
                        >
                            <Download className="w-4 h-4" />
                            Install App
                        </button>
                    )}

                    <button
                        onClick={dismiss}
                        className="mt-2 w-full text-xs text-gray-500 hover:text-gray-400 transition-colors py-1"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
}
