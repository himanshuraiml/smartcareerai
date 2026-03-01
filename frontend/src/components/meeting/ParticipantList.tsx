'use client';

import { X, MicOff, Crown, UserX, Hand } from 'lucide-react';
import { NetworkQualityBadge } from './NetworkQualityBadge';
import type { WaitingParticipant } from '@/hooks/useMeetingSocket';
import { authFetch } from '@/lib/auth-fetch';

interface ParticipantEntry {
    peerId: string;
    name: string;
    role: string;
    handRaised: boolean;
    audioMuted?: boolean;
    networkQuality?: number;
}

interface ParticipantListProps {
    participants: ParticipantEntry[];
    waitingParticipants: WaitingParticipant[];
    meetingId: string;
    isHost: boolean;
    onClose: () => void;
    onKick?: (peerId: string) => void;
}

export function ParticipantList({
    participants,
    waitingParticipants,
    meetingId,
    isHost,
    onClose,
}: ParticipantListProps) {
    const handleAdmit = async (participant: WaitingParticipant) => {
        await authFetch(`/meetings/${meetingId}/admit/${participant.userId}`, { method: 'POST' });
    };

    const handleDeny = async (participant: WaitingParticipant) => {
        // For deny, kick by finding the participant id — if they haven't been created yet we just ignore
        await authFetch(`/meetings/${meetingId}/kick/${participant.userId}`, { method: 'POST' }).catch(() => {});
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-sm font-semibold text-white">
                    Participants ({participants.length})
                </span>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Waiting room section */}
                {isHost && waitingParticipants.length > 0 && (
                    <div className="px-3 py-2 border-b border-gray-800">
                        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">
                            Waiting ({waitingParticipants.length})
                        </p>
                        {waitingParticipants.map((wp) => (
                            <div
                                key={wp.userId}
                                className="flex items-center justify-between py-2 px-1 rounded hover:bg-gray-800/50"
                            >
                                <span className="text-sm text-gray-200 truncate">
                                    {wp.name ?? wp.userId.slice(0, 8)}
                                </span>
                                <div className="flex gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleAdmit(wp)}
                                        className="px-2 py-0.5 rounded text-xs bg-green-600 hover:bg-green-500 text-white transition-colors"
                                    >
                                        Admit
                                    </button>
                                    <button
                                        onClick={() => handleDeny(wp)}
                                        className="px-2 py-0.5 rounded text-xs bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white transition-colors"
                                    >
                                        Deny
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* In-meeting participants */}
                <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        In meeting
                    </p>
                    {participants.map((p) => (
                        <div
                            key={p.peerId}
                            className="flex items-center justify-between py-2 px-1 rounded hover:bg-gray-800/50"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {p.role === 'HOST' && (
                                    <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                )}
                                <span className="text-sm text-gray-200 truncate">{p.name}</span>
                                {p.handRaised && <Hand className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {p.audioMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                                {p.networkQuality !== undefined && (
                                    <NetworkQualityBadge quality={p.networkQuality} />
                                )}
                                {isHost && p.role !== 'HOST' && (
                                    <button
                                        onClick={async () => {
                                            const dbPart = await authFetch(`/meetings/${meetingId}/participants`).then(r => r.json());
                                            const match = dbPart.data?.find((d: { userId: string; id: string }) => d.userId === p.peerId);
                                            if (match) {
                                                await authFetch(`/meetings/${meetingId}/kick/${match.id}`, { method: 'POST' });
                                            }
                                        }}
                                        className="text-gray-600 hover:text-red-400 transition-colors"
                                        title="Remove participant"
                                    >
                                        <UserX className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
