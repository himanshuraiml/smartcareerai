'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
    title: string;
    slug: string;
}

export default function ShareButton({ title, slug }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = `${window.location.origin}/blog/${slug}`;

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                // User cancelled or API unavailable — fall through to clipboard
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Last resort: prompt
            window.prompt('Copy this link:', url);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="flex items-center gap-2 text-indigo-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">Copied!</span>
                </>
            ) : (
                <>
                    <Share2 className="w-4 h-4" /> Share Article
                </>
            )}
        </button>
    );
}
