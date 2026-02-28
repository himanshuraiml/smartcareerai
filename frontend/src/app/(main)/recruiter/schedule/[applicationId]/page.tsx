'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import {
    Calendar, Clock, Users, Video, Download, CheckCircle,
    AlertCircle, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

interface TimeSlot {
    start: Date;
    end: Date;
}

interface ScheduleResult {
    eventLink?: string;
    meetLink?: string;
    teamsLink?: string;
    icsBase64?: string;
    eventId: string;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ScheduleInterviewPage() {
    const params = useParams();
    const applicationId = params?.applicationId as string;

    const [org, setOrg] = useState<{ id: string; name: string } | null>(null);
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; platform: string | null } | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const [attendeeEmails, setAttendeeEmails] = useState('');
    const [summary, setSummary] = useState('Technical Interview');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');

    // Week navigation
    const [weekStart, setWeekStart] = useState<Date>(startOfDay(new Date()));
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

    const [scheduling, setScheduling] = useState(false);
    const [result, setResult] = useState<ScheduleResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load org and calendar status
    useEffect(() => {
        const loadStatus = async () => {
            try {
                const orgRes = await authFetch('/organization/my');
                if (!orgRes.ok) return;
                const orgData = await orgRes.json();
                const orgInfo = orgData.data;
                setOrg({ id: orgInfo.id, name: orgInfo.name });

                const statusRes = await authFetch(`/organization/${orgInfo.id}/integrations/calendar/status`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setCalendarStatus(statusData.data);
                }
            } catch { /* ignore */ }
            finally { setLoadingStatus(false); }
        };
        loadStatus();
    }, []);

    const fetchSlots = useCallback(async () => {
        if (!org?.id || !calendarStatus?.connected || !attendeeEmails.trim()) return;

        setLoadingSlots(true);
        setSlots([]);
        setSelectedSlot(null);

        const emails = attendeeEmails.split(',').map(e => e.trim()).filter(Boolean);
        const timeMin = new Date(weekStart);
        timeMin.setHours(8, 0, 0, 0);
        const timeMax = addDays(weekStart, 7);
        timeMax.setHours(20, 0, 0, 0);

        const platform = calendarStatus.platform;
        const endpoint = platform === 'outlook'
            ? `/organization/${org.id}/integrations/outlook/availability`
            : `/organization/${org.id}/integrations/google-calendar/availability`;

        try {
            const res = await authFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails, timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), slotDurationMinutes: duration }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch availability');
            setSlots((data.data.slots || []).map((s: any) => ({ start: new Date(s.start), end: new Date(s.end) })));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingSlots(false);
        }
    }, [org?.id, calendarStatus, attendeeEmails, weekStart, duration]);

    const handleSchedule = async () => {
        if (!selectedSlot || !org?.id) return;
        setScheduling(true);
        setError(null);

        const emails = attendeeEmails.split(',').map(e => e.trim()).filter(Boolean);
        const platform = calendarStatus?.platform;
        const endpoint = platform === 'outlook'
            ? `/organization/${org.id}/integrations/outlook/schedule`
            : `/organization/${org.id}/integrations/google-calendar/schedule`;

        try {
            const res = await authFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary,
                    description,
                    startTime: selectedSlot.start.toISOString(),
                    endTime: selectedSlot.end.toISOString(),
                    attendeeEmails: emails,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to schedule interview');
            setResult(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setScheduling(false);
        }
    };

    const downloadIcs = (base64: string, filename: string) => {
        const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Group slots by day
    const slotsByDay: Record<string, TimeSlot[]> = {};
    for (const slot of slots) {
        const key = slot.start.toDateString();
        if (!slotsByDay[key]) slotsByDay[key] = [];
        slotsByDay[key].push(slot);
    }
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    if (loadingStatus) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (result) {
        return (
            <div className="max-w-lg mx-auto mt-16 p-8 bg-card border border-border rounded-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Interview Scheduled!</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Calendar invites have been sent to all attendees.
                    </p>
                </div>

                <div className="space-y-3">
                    {(result.meetLink || result.teamsLink) && (
                        <a
                            href={result.meetLink || result.teamsLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                        >
                            <Video className="h-4 w-4" />
                            Join Meeting Link
                        </a>
                    )}
                    {result.icsBase64 && (
                        <button
                            onClick={() => downloadIcs(result.icsBase64!, 'interview.ics')}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-border rounded-xl font-semibold text-sm hover:bg-muted/50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download .ics Calendar File
                        </button>
                    )}
                    {result.eventLink && (
                        <a
                            href={result.eventLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-center text-muted-foreground hover:underline"
                        >
                            View in Google Calendar
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Schedule Interview</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Application #{applicationId}
                    {org && <span className="ml-2 text-xs">· {org.name}</span>}
                </p>
            </div>

            {!calendarStatus?.connected && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                        No calendar connected. Go to{' '}
                        <a href="/recruiter/settings" className="underline font-semibold">Settings → Integrations</a>
                        {' '}to connect Google Calendar or Microsoft 365.
                    </span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Interview details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 bg-card border border-border rounded-2xl">
                <div>
                    <label className="block text-sm font-semibold mb-1">Interview Title</label>
                    <input
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1">Duration</label>
                    <select
                        value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Attendee Emails
                        <span className="font-normal text-muted-foreground ml-1">(comma-separated)</span>
                    </label>
                    <input
                        value={attendeeEmails}
                        onChange={e => setAttendeeEmails(e.target.value)}
                        placeholder="recruiter@company.com, candidate@email.com, manager@company.com"
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Description (optional)</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                        placeholder="Interview instructions, meeting agenda, etc."
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <button
                        onClick={fetchSlots}
                        disabled={!calendarStatus?.connected || !attendeeEmails.trim() || loadingSlots}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingSlots ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                        Check Availability
                    </button>
                </div>
            </div>

            {/* Slot picker */}
            {(slots.length > 0 || loadingSlots) && (
                <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Available Slots</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setWeekStart(d => addDays(d, -7))}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-muted-foreground">
                                {formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}
                            </span>
                            <button
                                onClick={() => setWeekStart(d => addDays(d, 7))}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {loadingSlots ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading availability...
                        </div>
                    ) : slots.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">No available slots this week. Try the next week.</p>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {days.map(day => {
                                const daySlots = slotsByDay[day.toDateString()] || [];
                                return (
                                    <div key={day.toDateString()} className="space-y-1.5">
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                            <p className="text-sm font-bold">{day.getDate()}</p>
                                        </div>
                                        {daySlots.map((slot, i) => {
                                            const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`w-full text-xs px-1 py-1.5 rounded-lg border transition-colors ${isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-muted/30 border-border hover:bg-primary/10 hover:border-primary/30'}`}
                                                >
                                                    {formatTime(slot.start)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm panel */}
            {selectedSlot && (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl space-y-4">
                    <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Confirm Scheduling</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-emerald-700 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {formatDate(selectedSlot.start)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Video className="h-4 w-4" />
                            {calendarStatus?.platform === 'outlook' ? 'Microsoft Teams' : 'Google Meet'} link will be auto-generated
                        </span>
                    </div>
                    <button
                        onClick={handleSchedule}
                        disabled={scheduling}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        {scheduling ? 'Scheduling...' : 'Confirm & Send Invites'}
                    </button>
                </div>
            )}
        </div>
    );
}
