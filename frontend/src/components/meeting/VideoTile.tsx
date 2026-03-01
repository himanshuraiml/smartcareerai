'use client';

import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Hand, Wifi } from 'lucide-react';

interface VideoTileProps {
    stream: MediaStream | null;
    name: string;
    role?: string;
    isMuted?: boolean;
    handRaised?: boolean;
    isLocal?: boolean;
    isLarge?: boolean;
}

export function VideoTile({ stream, name, role, isMuted, handRaised, isLocal, isLarge }: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`relative rounded-xl overflow-hidden bg-gray-900 border border-gray-700 ${isLarge ? 'aspect-video' : 'aspect-video'}`}>
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                </div>
            )}

            {/* Overlays */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">
                            {name} {isLocal && '(You)'}
                        </span>
                        {role && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/80 text-white">
                                {role}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {isMuted ? (
                            <MicOff className="w-4 h-4 text-red-400" />
                        ) : (
                            <Mic className="w-4 h-4 text-green-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Raise hand indicator */}
            {handRaised && (
                <div className="absolute top-3 right-3 animate-bounce">
                    <div className="bg-yellow-500 rounded-full p-2">
                        <Hand className="w-4 h-4 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
