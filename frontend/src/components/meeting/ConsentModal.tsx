'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface ConsentModalProps {
    onConsent: (consented: boolean) => void;
}

export function ConsentModal({ onConsent }: ConsentModalProps) {
    const [agreed, setAgreed] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600/20 rounded-xl">
                        <Shield className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Recording Consent</h2>
                        <p className="text-sm text-gray-400">Required before joining</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-yellow-200">
                            This meeting may be recorded for quality assurance and training purposes.
                            Your audio, video, and transcript data will be processed and stored securely.
                        </p>
                    </div>

                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-1">&#8226;</span>
                            Audio and video will be recorded and stored securely
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-1">&#8226;</span>
                            AI transcription will process your speech in real-time
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-1">&#8226;</span>
                            Meeting data will be used for interview analytics
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-400 mt-1">&#8226;</span>
                            You can request data deletion at any time
                        </li>
                    </ul>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-200">
                        I consent to the recording and processing of this meeting
                    </span>
                </label>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onConsent(false)}
                    >
                        Decline & Leave
                    </Button>
                    <Button
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        disabled={!agreed}
                        onClick={() => onConsent(true)}
                    >
                        Join Meeting
                    </Button>
                </div>
            </div>
        </div>
    );
}
