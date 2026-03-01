'use client';

import { useEffect, useRef } from 'react';
import { Monitor, X } from 'lucide-react';

interface ScreenShareOverlayProps {
    stream: MediaStream;
    sharerName: string;
    isLocal: boolean;
    onStop?: () => void;
}

export function ScreenShareOverlay({ stream, sharerName, isLocal, onStop }: ScreenShareOverlayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="absolute inset-0 flex flex-col bg-gray-950 z-20">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/90 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <Monitor className="w-4 h-4" />
                    <span>{isLocal ? 'You are' : `${sharerName} is`} sharing their screen</span>
                </div>
                {isLocal && onStop && (
                    <button
                        onClick={onStop}
                        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Stop sharing
                    </button>
                )}
            </div>

            {/* Screen content */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className="flex-1 object-contain bg-black"
            />
        </div>
    );
}
