'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CopilotOverlay } from '@/components/copilot/CopilotOverlay';

export default function LiveInterviewPage() {
    const params = useParams();
    const interviewId = params?.id as string;
    const [meetingUrl, setMeetingUrl] = useState<string>('');

    // In a real implementation, you would fetch the interview details from your backend API
    // and verify the current user is a recruiter who owns this interview.
    // We are mocking the meeting URL input for MVP testing:
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem('meetingUrl') as HTMLInputElement;
        setMeetingUrl(input.value);
    };

    if (!interviewId) return <div>Loading...</div>;

    if (!meetingUrl) {
        return (
            <div className="container mx-auto p-6 max-w-xl">
                <h1 className="text-2xl font-bold mb-6">Start Live Interview Copilot</h1>
                <div className="bg-card shadow rounded-lg p-6 border border-border">
                    <p className="text-sm text-muted-foreground mb-4">
                        Please enter the Google Meet URL for interview {interviewId}.
                        Normally, this would be auto-fetched from the ATS integration and Google Calendar.
                    </p>
                    <form onSubmit={handleUrlSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Google Meet URL</label>
                            <input
                                type="url"
                                name="meetingUrl"
                                required
                                placeholder="https://meet.google.com/abc-defg-hij"
                                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2"
                        >
                            Connect Copilot
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 h-[calc(100vh-100px)]">
            <CopilotOverlay interviewId={interviewId} meetingUrl={meetingUrl} />
        </div>
    );
}
