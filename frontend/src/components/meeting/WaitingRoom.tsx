'use client';

import { Loader2 } from 'lucide-react';

interface WaitingRoomProps {
    meetingId: string;
    onCancel: () => void;
}

export function WaitingRoom({ meetingId, onCancel }: WaitingRoomProps) {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-950 gap-6">
            <div className="text-center space-y-3">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
                <h2 className="text-xl font-semibold text-white">Waiting to be admitted</h2>
                <p className="text-gray-400 text-sm max-w-xs">
                    The host will let you in shortly. Please wait while they review your request.
                </p>
            </div>

            <div className="flex flex-col items-center gap-2 text-xs text-gray-600">
                <span>Meeting: {meetingId.slice(0, 8)}…</span>
            </div>

            <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
            >
                Leave waiting room
            </button>
        </div>
    );
}
