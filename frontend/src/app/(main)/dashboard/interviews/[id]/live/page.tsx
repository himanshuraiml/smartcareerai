'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { CopilotOverlay } from '@/components/copilot/CopilotOverlay';
import { MeetingRoom } from '@/components/meeting/MeetingRoom';

export default function LiveInterviewRedirect() {
    const params = useParams();
    const interviewId = params?.id as string;
    const [interviewStarted, setInterviewStarted] = useState(false);

    // Using the SmartCareerAI native MeetingRoom instead of Google Meet
    // We assume the meeting string ID is the same as the interview ID for Live sessions.

    return (
        <div className="flex h-screen w-full relative overflow-hidden bg-background">
            <div className="flex-1 w-full h-full relative z-0">
                <MeetingRoom
                    meetingId={interviewId}
                    onInterviewStarted={() => setInterviewStarted(true)}
                />
            </div>

            {/* The Copilot overlay sits on top of the meeting room for the recruiter */}
            <div className="absolute right-0 top-0 bottom-0 w-96 max-w-[30vw] z-10 bg-background/95 backdrop-blur shadow-2xl border-l border-border pointer-events-auto h-full overflow-hidden flex flex-col pt-16 mt-4 pb-4">
                <CopilotOverlay
                    interviewId={interviewId}
                    meetingUrl={`/meeting/${interviewId}`}
                    triggerStart={interviewStarted}
                />
            </div>
        </div>
    );
}
