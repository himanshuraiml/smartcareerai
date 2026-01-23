'use client';

import { useState, useEffect } from 'react';
import { Mail, Link2, Unlink, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || 'http://localhost:3013/api/v1/email';

interface EmailConnection {
    email: string;
    isActive: boolean;
    lastSyncAt: string | null;
    createdAt: string;
}

interface TrackedEmail {
    id: string;
    subject: string;
    sender: string;
    snippet: string;
    type: 'APPLICATION_RECEIVED' | 'INTERVIEW' | 'OFFER' | 'REJECTION' | 'UPDATE' | 'OTHER';
    companyName: string;
    receivedAt: string;
    isRead: boolean;
}

const emailTypeConfig = {
    APPLICATION_RECEIVED: { label: 'Application Received', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
    INTERVIEW: { label: 'Interview', color: 'bg-purple-500/20 text-purple-400', icon: Clock },
    OFFER: { label: 'Offer', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    REJECTION: { label: 'Rejection', color: 'bg-red-500/20 text-red-400', icon: XCircle },
    UPDATE: { label: 'Update', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
    OTHER: { label: 'Other', color: 'bg-gray-500/20 text-gray-400', icon: Mail },
};

export function EmailTrackingCard() {
    const { accessToken } = useAuthStore();
    const [connection, setConnection] = useState<EmailConnection | null>(null);
    const [emails, setEmails] = useState<TrackedEmail[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        fetchConnectionStatus();
    }, [accessToken]);

    const fetchConnectionStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/connection`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.data?.email) {
                    setConnection(data.data);
                    fetchTrackedEmails();
                }
            }
        } catch (error) {
            console.error('Failed to fetch connection status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrackedEmails = async () => {
        try {
            const response = await fetch(`${API_URL}/tracked?limit=5`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEmails(data.data?.emails || []);
            }
        } catch (error) {
            console.error('Failed to fetch tracked emails:', error);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const response = await fetch(`${API_URL}/oauth/url`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                window.location.href = data.data.url;
            }
        } catch (error) {
            console.error('Failed to get OAuth URL:', error);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            const response = await fetch(`${API_URL}/connection`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                setConnection(null);
                setEmails([]);
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`${API_URL}/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            await fetchTrackedEmails();
        } catch (error) {
            console.error('Failed to sync:', error);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 rounded-2xl glass">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl glass">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Email Tracking</h3>
                        <p className="text-gray-400 text-sm">Auto-detect job application updates</p>
                    </div>
                </div>

                {connection?.isActive && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-400 ${syncing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        >
                            <Unlink className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {!connection?.isActive ? (
                <div className="text-center py-6">
                    <p className="text-gray-400 mb-4">Connect your Gmail to automatically track job application emails</p>
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:opacity-90 transition"
                    >
                        {connecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Link2 className="w-4 h-4" />
                        )}
                        Connect Gmail
                    </button>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm">{connection.email}</span>
                        </div>
                        {connection.lastSyncAt && (
                            <span className="text-gray-500 text-xs">
                                Last sync: {new Date(connection.lastSyncAt).toLocaleString()}
                            </span>
                        )}
                    </div>

                    {emails.length > 0 ? (
                        <div className="space-y-2">
                            {emails.map((email) => {
                                const config = emailTypeConfig[email.type];
                                const Icon = config.icon;
                                return (
                                    <div key={email.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">{email.companyName}</span>
                                                </div>
                                                <p className="text-white text-sm font-medium truncate">{email.subject}</p>
                                                <p className="text-gray-400 text-xs truncate">{email.snippet}</p>
                                            </div>
                                            <span className="text-gray-500 text-xs whitespace-nowrap ml-2">
                                                {new Date(email.receivedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No job emails detected yet. Check back after the next sync!</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default EmailTrackingCard;
