'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useMediaSoup } from '@/hooks/useMediaSoup';
import { useMeetingSocket, type ProducerInfo, type WaitingParticipant } from '@/hooks/useMeetingSocket';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useMeetingChat } from '@/hooks/useMeetingChat';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';

import { VideoTile } from './VideoTile';
import { ControlBar } from './ControlBar';
import { ChatPanel } from './ChatPanel';
import { ConsentModal } from './ConsentModal';
import { ScreenShareOverlay } from './ScreenShareOverlay';
import { ParticipantList } from './ParticipantList';
import { MeetingTimer } from './MeetingTimer';
import { WaitingRoom } from './WaitingRoom';
import { RaiseHandIndicator } from './RaiseHandIndicator';
import { NetworkQualityBadge } from './NetworkQualityBadge';

interface MeetingRoomProps {
    meetingId: string;
}

interface PeerState {
    peerId: string;
    role: string;
    name: string;
    handRaised: boolean;
    networkQuality: number;
}

type SidePanel = 'chat' | 'participants' | null;

export function MeetingRoom({ meetingId }: MeetingRoomProps) {
    const router = useRouter();
    const { user } = useAuthStore();

    // UI state
    const [showConsent, setShowConsent] = useState(true);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [inWaitingRoom, setInWaitingRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState('CANDIDATE');
    const [sidePanel, setSidePanel] = useState<SidePanel>(null);
    const [handRaised, setHandRaised] = useState(false);
    const [meetingTimer, setMeetingTimer] = useState(0);

    // Peer tracking
    const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());
    const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);
    const [peerNetworkQuality, setPeerNetworkQuality] = useState<Map<string, number>>(new Map());

    // Remote screen sharers: peerId → producerId
    const [remoteScreenSharers, setRemoteScreenSharers] = useState<Map<string, string>>(new Map());

    // Hooks
    const mediasoup = useMediaSoup({ meetingId });
    const chat = useMeetingChat();
    const { quality: myNetworkQuality } = useNetworkQuality({
        getSendTransportStats: mediasoup.getSendTransportStats,
        enabled: joined,
    });

    // Stable ref so useMeetingSocket's effect deps don't re-fire on every render
    const handleRoomJoinedRef = useRef<(data: {
        routerRtpCapabilities: unknown;
        existingProducers: ProducerInfo[];
        participantCount: number;
    }) => void>(() => {});

    // Update the ref's implementation each render without changing the identity
    const handleRoomJoinedImpl = useCallback(async (data: {
        routerRtpCapabilities: unknown;
        existingProducers: ProducerInfo[];
        participantCount: number;
    }) => {
        try {
            setInWaitingRoom(false);
            await mediasoup.loadDevice(data.routerRtpCapabilities);
            await mediasoup.createSendTransport();
            await mediasoup.createRecvTransport();
            await mediasoup.publishMedia();
            for (const producer of data.existingProducers) {
                await mediasoup.consumeProducer(producer.producerId, producer.participantId);
            }
            setJoined(true);
            setJoining(false);
        } catch (err: unknown) {
            setError((err as Error).message);
            setJoining(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    handleRoomJoinedRef.current = handleRoomJoinedImpl;

    const socket = useMeetingSocket({
        meetingId,
        role,
        onRoomJoined: (data) => handleRoomJoinedRef.current(data),
        onNewPeer: (peer) => {
            setPeers((prev) => {
                const next = new Map(prev);
                next.set(peer.peerId, {
                    peerId: peer.peerId,
                    role: peer.role,
                    name: peer.peerId.slice(0, 8),
                    handRaised: false,
                    networkQuality: 5,
                });
                return next;
            });
        },
        onPeerLeft: (data) => {
            setPeers((prev) => { const next = new Map(prev); next.delete(data.peerId); return next; });
            mediasoup.removeRemoteStream(data.peerId);
            setRemoteScreenSharers((prev) => { const next = new Map(prev); next.delete(data.peerId); return next; });
        },
        onNewProducer: async (data) => {
            if ((data.appData as Record<string, unknown>)?.type === 'screen') {
                setRemoteScreenSharers((prev) => new Map(prev).set(data.peerId, data.producerId));
            }
            await mediasoup.consumeProducer(data.producerId, data.peerId);
        },
        onProducerClosed: (data) => {
            setRemoteScreenSharers((prev) => {
                const next = new Map(prev);
                for (const [peerId, pid] of next) {
                    if (pid === data.producerId) next.delete(peerId);
                }
                return next;
            });
        },
        onHandRaised: (data) => {
            setPeers((prev) => {
                const next = new Map(prev);
                const peer = next.get(data.peerId);
                if (peer) next.set(data.peerId, { ...peer, handRaised: data.raised });
                return next;
            });
        },
        onChatMessage: chat.addMessage,
        onWaitingRoom: () => { setInWaitingRoom(true); setJoining(false); },
        onParticipantWaiting: (p) => {
            setWaitingParticipants((prev) =>
                prev.some((x) => x.userId === p.userId) ? prev : [...prev, p],
            );
        },
        onKicked: () => { mediasoup.cleanup(); router.push('/dashboard/interviews'); },
        onNetworkQuality: (update) => {
            setPeerNetworkQuality((prev) => new Map(prev).set(update.peerId, update.quality));
            setPeers((prev) => {
                const next = new Map(prev);
                const peer = next.get(update.peerId);
                if (peer) next.set(update.peerId, { ...peer, networkQuality: update.quality });
                return next;
            });
        },
    });

    // Screen share
    const screenShare = useScreenShare({
        publishTrack: mediasoup.publishTrack,
        closeProducer: mediasoup.closeProducer,
        onStarted: (producerId) => socket.notifyNewProducer(producerId, 'video', { type: 'screen' }),
        onStopped: (producerId) => socket.notifyProducerClosed(producerId),
    });

    // Meeting timer
    useEffect(() => {
        if (!joined) return;
        const id = setInterval(() => setMeetingTimer((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [joined]);

    // Chat unread tracking
    useEffect(() => {
        if (sidePanel === 'chat') chat.markRead();
        else chat.markClosed();
    }, [sidePanel, chat]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleConsent = async (consented: boolean) => {
        if (!consented) { router.push('/dashboard/interviews'); return; }
        setShowConsent(false);
        setJoining(true);
        try {
            const res = await authFetch(`/meetings/${meetingId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consentGiven: true }),
            });
            const json = await res.json();
            if (json.success) {
                setRole(json.data.role);
            } else {
                setError(json.error);
                setJoining(false);
            }
        } catch (err: unknown) {
            setError((err as Error).message);
            setJoining(false);
        }
    };

    const handleEndCall = async () => {
        mediasoup.cleanup();
        await authFetch(`/meetings/${meetingId}/leave`, { method: 'DELETE' });
        router.push('/dashboard/interviews');
    };

    const handleToggleHand = () => {
        const next = !handRaised;
        setHandRaised(next);
        socket.raiseHand(next);
    };

    const handleToggleScreenShare = async () => {
        if (screenShare.isSharing) screenShare.stopScreenShare();
        else await screenShare.startScreenShare();
    };

    const togglePanel = (panel: SidePanel) =>
        setSidePanel((p) => (p === panel ? null : panel));

    // ── Render guards ─────────────────────────────────────────────────────────
    if (showConsent) return <ConsentModal onConsent={handleConsent} />;

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-lg">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/interviews')}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                        Back to Interviews
                    </button>
                </div>
            </div>
        );
    }

    if (inWaitingRoom) {
        return (
            <WaitingRoom
                meetingId={meetingId}
                onCancel={() => { mediasoup.cleanup(); router.push('/dashboard/interviews'); }}
            />
        );
    }

    if (joining || !joined) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-gray-300">Connecting to meeting…</p>
                </div>
            </div>
        );
    }

    // ── Derived state ─────────────────────────────────────────────────────────
    const remoteVideos = mediasoup.remoteStreams.filter((s) => s.kind === 'video');

    const remoteScreenEntry = [...remoteScreenSharers.entries()][0];
    const remoteScreenStream = remoteScreenEntry
        ? mediasoup.remoteStreams.find((s) => s.peerId === remoteScreenEntry[0])?.stream
        : null;
    const activeScreenSharerName = remoteScreenEntry
        ? (peers.get(remoteScreenEntry[0])?.name ?? remoteScreenEntry[0].slice(0, 8))
        : null;

    const showScreenOverlay =
        (screenShare.isSharing && !!screenShare.screenStream) ||
        (!screenShare.isSharing && !!remoteScreenStream);

    const participantListEntries = [...peers.values()].map((p) => ({
        ...p,
        networkQuality: peerNetworkQuality.get(p.peerId) ?? p.networkQuality,
    }));

    return (
        <div className="h-screen flex flex-col bg-gray-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono">{meetingId.slice(0, 8)}…</span>
                    {role === 'HOST' && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                            Host
                        </span>
                    )}
                    {waitingParticipants.length > 0 && (
                        <button
                            onClick={() => togglePanel('participants')}
                            className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium hover:bg-yellow-500/30 transition-colors"
                        >
                            {waitingParticipants.length} waiting
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <MeetingTimer seconds={meetingTimer} />
                    <NetworkQualityBadge quality={myNetworkQuality} />
                    <div
                        className={`w-2 h-2 rounded-full ${socket.connected ? 'bg-green-500' : 'bg-red-500'}`}
                        title={socket.connected ? 'Connected' : 'Disconnected'}
                    />
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Video area */}
                <div className="flex-1 flex flex-col p-3 gap-3 relative min-w-0">
                    {/* Screen share overlay */}
                    {showScreenOverlay && screenShare.isSharing && screenShare.screenStream && (
                        <ScreenShareOverlay
                            stream={screenShare.screenStream}
                            sharerName={user?.name ?? 'You'}
                            isLocal
                            onStop={screenShare.stopScreenShare}
                        />
                    )}
                    {showScreenOverlay && !screenShare.isSharing && remoteScreenStream && activeScreenSharerName && (
                        <ScreenShareOverlay
                            stream={remoteScreenStream}
                            sharerName={activeScreenSharerName}
                            isLocal={false}
                        />
                    )}

                    {/* Main video */}
                    <div className="flex-1 relative">
                        {remoteVideos.length > 0 ? (
                            <>
                                <VideoTile
                                    stream={remoteVideos[0].stream}
                                    name={peers.get(remoteVideos[0].peerId)?.name ?? remoteVideos[0].peerId.slice(0, 8)}
                                    role={peers.get(remoteVideos[0].peerId)?.role}
                                    handRaised={peers.get(remoteVideos[0].peerId)?.handRaised}
                                    isLarge
                                />
                                <div className="absolute top-2 right-2">
                                    <NetworkQualityBadge quality={peerNetworkQuality.get(remoteVideos[0].peerId) ?? 5} />
                                </div>
                                {peers.get(remoteVideos[0].peerId)?.handRaised && (
                                    <div className="absolute top-2 left-2">
                                        <RaiseHandIndicator raised />
                                    </div>
                                )}
                            </>
                        ) : (
                            <VideoTile
                                stream={mediasoup.localStream}
                                name={user?.name ?? 'You'}
                                role={role}
                                isMuted={mediasoup.audioMuted}
                                handRaised={handRaised}
                                isLocal
                                isLarge
                            />
                        )}
                    </div>

                    {/* Thumbnail strip */}
                    <div className="flex gap-2 overflow-x-auto shrink-0">
                        {remoteVideos.length > 0 && (
                            <div className="w-44 shrink-0">
                                <VideoTile
                                    stream={mediasoup.localStream}
                                    name={user?.name ?? 'You'}
                                    role={role}
                                    isMuted={mediasoup.audioMuted}
                                    handRaised={handRaised}
                                    isLocal
                                />
                            </div>
                        )}
                        {remoteVideos.slice(1).map((rs) => (
                            <div key={rs.consumerId} className="w-44 shrink-0 relative">
                                <VideoTile
                                    stream={rs.stream}
                                    name={peers.get(rs.peerId)?.name ?? rs.peerId.slice(0, 8)}
                                    role={peers.get(rs.peerId)?.role}
                                    handRaised={peers.get(rs.peerId)?.handRaised}
                                />
                                {peers.get(rs.peerId)?.handRaised && (
                                    <div className="absolute top-1 left-1">
                                        <RaiseHandIndicator raised />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat panel */}
                {sidePanel === 'chat' && (
                    <div className="w-80 shrink-0 border-l border-gray-800">
                        <ChatPanel
                            messages={chat.messages}
                            currentUserId={user?.id ?? ''}
                            onSendMessage={socket.sendChatMessage}
                            onClose={() => setSidePanel(null)}
                        />
                    </div>
                )}

                {/* Participants panel */}
                {sidePanel === 'participants' && (
                    <div className="w-72 shrink-0">
                        <ParticipantList
                            participants={[
                                {
                                    peerId: user?.id ?? '',
                                    name: `${user?.name ?? 'You'} (you)`,
                                    role,
                                    handRaised,
                                    audioMuted: mediasoup.audioMuted,
                                    networkQuality: myNetworkQuality,
                                },
                                ...participantListEntries,
                            ]}
                            waitingParticipants={waitingParticipants}
                            meetingId={meetingId}
                            isHost={role === 'HOST'}
                            onClose={() => setSidePanel(null)}
                        />
                    </div>
                )}
            </div>

            {/* Control bar */}
            <ControlBar
                audioMuted={mediasoup.audioMuted}
                videoMuted={mediasoup.videoMuted}
                handRaised={handRaised}
                screenSharing={screenShare.isSharing}
                chatOpen={sidePanel === 'chat'}
                participantCount={peers.size + 1}
                onToggleAudio={mediasoup.toggleAudio}
                onToggleVideo={mediasoup.toggleVideo}
                onToggleScreenShare={handleToggleScreenShare}
                onToggleHand={handleToggleHand}
                onToggleChat={() => togglePanel('chat')}
                onEndCall={handleEndCall}
                chatUnread={chat.unreadCount}
                onToggleParticipants={() => togglePanel('participants')}
                participantListOpen={sidePanel === 'participants'}
                waitingCount={waitingParticipants.length}
            />
        </div>
    );
}
