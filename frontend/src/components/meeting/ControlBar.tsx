'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    Hand,
    MessageSquare,
    PhoneOff,
    Users,
} from 'lucide-react';

interface ControlBarProps {
    audioMuted: boolean;
    videoMuted: boolean;
    handRaised: boolean;
    screenSharing: boolean;
    chatOpen: boolean;
    participantCount: number;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onToggleHand: () => void;
    onToggleChat: () => void;
    onEndCall: () => void;
    // Phase 2 additions
    chatUnread?: number;
    participantListOpen?: boolean;
    onToggleParticipants?: () => void;
    waitingCount?: number;
}

export function ControlBar({
    audioMuted,
    videoMuted,
    handRaised,
    screenSharing,
    chatOpen,
    participantCount,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onToggleHand,
    onToggleChat,
    onEndCall,
    chatUnread = 0,
    participantListOpen = false,
    onToggleParticipants,
    waitingCount = 0,
}: ControlBarProps) {
    return (
        <div className="flex items-center justify-center gap-3 p-4 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 shrink-0">
            {/* Audio toggle */}
            <Button
                variant={audioMuted ? 'destructive' : 'secondary'}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
                onClick={onToggleAudio}
                title={audioMuted ? 'Unmute' : 'Mute'}
            >
                {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Video toggle */}
            <Button
                variant={videoMuted ? 'destructive' : 'secondary'}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
                onClick={onToggleVideo}
                title={videoMuted ? 'Turn on camera' : 'Turn off camera'}
            >
                {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            {/* Screen share */}
            <Button
                variant={screenSharing ? 'default' : 'secondary'}
                size="lg"
                className={`rounded-full w-12 h-12 p-0 ${screenSharing ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                onClick={onToggleScreenShare}
                title={screenSharing ? 'Stop sharing' : 'Share screen'}
            >
                <Monitor className="w-5 h-5" />
            </Button>

            {/* Raise hand */}
            <Button
                variant={handRaised ? 'default' : 'secondary'}
                size="lg"
                className={`rounded-full w-12 h-12 p-0 ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900' : ''}`}
                onClick={onToggleHand}
                title={handRaised ? 'Lower hand' : 'Raise hand'}
            >
                <Hand className="w-5 h-5" />
            </Button>

            {/* Chat */}
            <Button
                variant={chatOpen ? 'default' : 'secondary'}
                size="lg"
                className={`rounded-full w-12 h-12 p-0 relative ${chatOpen ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                onClick={onToggleChat}
                title="Chat"
            >
                <MessageSquare className="w-5 h-5" />
                {chatUnread > 0 && !chatOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {chatUnread > 9 ? '9+' : chatUnread}
                    </span>
                )}
            </Button>

            {/* Participants */}
            {onToggleParticipants && (
                <Button
                    variant={participantListOpen ? 'default' : 'secondary'}
                    size="lg"
                    className={`rounded-full w-12 h-12 p-0 relative ${participantListOpen ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    onClick={onToggleParticipants}
                    title="Participants"
                >
                    <Users className="w-5 h-5" />
                    {waitingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-yellow-900 text-[10px] font-bold flex items-center justify-center">
                            {waitingCount}
                        </span>
                    )}
                </Button>
            )}

            {/* Participant count badge (when no separate list button) */}
            {!onToggleParticipants && (
                <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-800 text-gray-300 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{participantCount}</span>
                </div>
            )}

            {/* End call */}
            <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-14 h-12 p-0 ml-4"
                onClick={onEndCall}
                title="End call"
            >
                <PhoneOff className="w-5 h-5" />
            </Button>
        </div>
    );
}
