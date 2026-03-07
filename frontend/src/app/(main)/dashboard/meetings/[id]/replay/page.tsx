'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Play, Pause } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { TranscriptEntry } from '@/components/meeting/TranscriptEntry';
import { TranscriptSegment } from '@/hooks/useMeetingTranscript';

interface RecordingData {
    presignedUrl: string;
    duration?: number;
}

export default function MeetingReplayPage() {
    const { id: meetingId } = useParams<{ id: string }>();
    const router = useRouter();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [recording, setRecording] = useState<RecordingData | null>(null);
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const [recRes, transcriptRes] = await Promise.all([
                    authFetch(`/api/v1/meetings/${meetingId}/recording`),
                    authFetch(`/api/v1/meeting-analysis/${meetingId}/transcript`),
                ]);

                if (recRes.ok) {
                    const recBody = await recRes.json();
                    setRecording(recBody.data);
                } else {
                    setError('Recording not available.');
                }

                if (transcriptRes.ok) {
                    const transcriptBody = await transcriptRes.json();
                    setSegments(transcriptBody.data ?? []);
                }
            } catch {
                setError('Failed to load replay.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [meetingId]);

    // Sync current time from video
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, [recording]);

    // Auto-scroll active segment into view
    useEffect(() => {
        activeSegmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [currentTime]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        playing ? video.pause() : video.play();
    };

    const seekToSegment = (startTime: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = startTime;
        video.play();
    };

    // Active segment = startTime ≤ currentTime ≤ endTime
    const activeIndex = segments.findIndex(
        s => currentTime >= s.startTime && currentTime <= s.endTime,
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-zinc-400">{error}</p>
                <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-300">
                    Go back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-zinc-400" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">Meeting Replay</h1>
                        <p className="text-zinc-500 text-sm">{meetingId}</p>
                    </div>
                    <div className="ml-auto">
                        <a
                            href={`/dashboard/meetings/${meetingId}/analysis`}
                            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            View AI Analysis →
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Video player */}
                    <div className="lg:col-span-3 space-y-3">
                        <div className="bg-zinc-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                            {recording?.presignedUrl ? (
                                <video
                                    ref={videoRef}
                                    src={recording.presignedUrl}
                                    className="w-full h-full"
                                    controls
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                    <AlertCircle className="h-8 w-8" />
                                    <p className="text-sm">Video not available</p>
                                </div>
                            )}
                        </div>

                        {recording?.presignedUrl && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={togglePlay}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    {playing ? 'Pause' : 'Play'}
                                </button>
                                <span className="text-zinc-500 text-sm font-mono">
                                    {formatTime(currentTime)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Synced transcript */}
                    <div className="lg:col-span-2 flex flex-col">
                        <div className="bg-zinc-900 rounded-xl overflow-hidden flex flex-col h-full max-h-[600px]">
                            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-zinc-200">Transcript</h3>
                                <span className="text-xs text-zinc-500">{segments.length} segments</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {segments.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
                                        No transcript available.
                                    </div>
                                ) : (
                                    segments.map((seg, i) => {
                                        const isActive = i === activeIndex;
                                        return (
                                            <div
                                                key={seg.id}
                                                ref={isActive ? activeSegmentRef : undefined}
                                                onClick={() => seekToSegment(seg.startTime)}
                                                className={`rounded-lg cursor-pointer transition-colors ${
                                                    isActive
                                                        ? 'bg-violet-500/15 ring-1 ring-violet-500/30'
                                                        : 'hover:bg-zinc-800'
                                                }`}
                                            >
                                                <TranscriptEntry
                                                    segment={seg}
                                                    isCurrentUser={false}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
