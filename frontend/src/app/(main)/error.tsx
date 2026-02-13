'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
                <p className="text-gray-400 mb-6">{error.message}</p>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}


