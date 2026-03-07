'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Video } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

export default function LiveInterviewRedirect() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params?.id as string;
    const [error, setError] = useState('');

    useEffect(() => {
        if (!interviewId) return;

        const initializeMeeting = async () => {
            try {
                // First check if a meeting link already exists
                const sessionRes = await authFetch(`/interviews/sessions/${interviewId}`);
                if (sessionRes.ok) {
                    const { data } = await sessionRes.json();
                    if (data?.meetLink) {
                        return router.replace(data.meetLink);
                    }
                }

                // If no meetLink is present, fetch/create a native meeting via media-service proxy
                const meetRes = await authFetch(`/meetings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interviewId, maxParticipants: 5 })
                });

                if (meetRes.ok) {
                    const { data } = await meetRes.json();
                    if (data?.id) {
                        // Successfully created or retrieved! Update the interview session in DB with this link?
                        // The backend /meetings actually doesn't map it back automatically to interview session yet unless recruiter jobService did it.
                        // However, routing there is enough to join the meeting room.
                        router.replace(`/dashboard/meetings/${data.id}`);
                        return;
                    }
                }

                // Fallback attempt -- read response
                const errText = await meetRes.text();
                throw new Error(errText || 'Failed to create internal meeting room.');
            } catch (err: any) {
                console.error('Meeting init error:', err);
                setError(err.message || 'Unable to connect to meeting server. Please try again.');
            }
        };

        initializeMeeting();
    }, [interviewId, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold dark:text-white">Connection Error</h2>
                <p className="text-gray-500 text-center max-w-sm">{error}</p>
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => router.back()}
                        className="px-5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-sm font-semibold transition"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-teal-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-teal-500">
                    <Video className="w-6 h-6 animate-pulse" />
                </div>
            </div>

            <div className="text-center space-y-1">
                <p className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                    Securing Connection
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Initializing your built-in video meeting room...
                </p>
            </div>
        </div>
    );
}
