'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetch, authFetchJson } from '@/lib/auth-fetch';
import { Loader2, Camera, Mic, Play, Square, CheckCircle2, AlertCircle, ChevronRight, Code2 } from 'lucide-react';
import Editor from "@monaco-editor/react";

// Interfaces
interface JobDetails {
    id: string;
    title: string;
    description: string;
    aiInterviewConfig: any;
    recruiter: {
        organization: {
            name: string;
            logoUrl: string | null;
            isWhiteLabel?: boolean;
            theme?: any;
            customDomain?: string;
        };
    };
}

interface InterviewSession {
    id: string;
    status: string;
    questions?: any[];
}

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    orderIndex: number;
    isCodingChallenge?: boolean;
    starterCode?: string;
}

export default function CandidateInterviewPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.jobId as string;

    // View state
    const [viewState, setViewState] = useState<'loading' | 'welcome' | 'setup' | 'interview' | 'completed' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Business Data
    const [job, setJob] = useState<JobDetails | null>(null);
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Media State
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Transcription State
    const recognitionRef = useRef<any>(null);
    const [liveTranscript, setLiveTranscript] = useState('');
    const finalTranscriptRef = useRef('');
    const recordingStartTimeRef = useRef(0);

    // Code State
    const [codeValue, setCodeValue] = useState("");

    // Update code value when question changes
    useEffect(() => {
        const q = questions[currentQuestionIndex];
        if (q?.isCodingChallenge) {
            setCodeValue(q.starterCode || "// Write your code here...\n\n");
        } else {
            setCodeValue("");
        }
    }, [currentQuestionIndex, questions]);

    // Load Job Details
    useEffect(() => {
        const fetchJob = async () => {
            setViewState('loading');
            try {
                const { data, error } = await authFetchJson(`/recruiter/public/jobs/${jobId}`);
                if (error || !data) throw new Error(error || 'Failed to load job details');
                setJob(data);

                // Do they already have a session for this job?
                // For simplicity in Phase 1, we let them create a fresh session when they click "Start"
                setViewState('welcome');
            } catch (err: any) {
                setErrorMsg(err.message);
                setViewState('error');
            }
        };
        fetchJob();
    }, [jobId]);

    // Setup Media and Recognition
    const setupDevices = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasPermissions(true);
            setViewState('interview');

            // Initialize Speech Recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (final) {
                        finalTranscriptRef.current += ' ' + final;
                    }
                    setLiveTranscript(finalTranscriptRef.current + ' ' + interimTranscript);
                };

                recognition.onerror = (e: any) => {
                    console.error('Speech recognition error', e.error);
                };

                recognitionRef.current = recognition;
            } else {
                console.warn('SpeechRecognition API not supported in this browser.');
            }

            // Begin Interview Session
            await startInterviewSession();

        } catch (err) {
            console.error('Failed to get media devices', err);
            setErrorMsg('Camera and microphone access is required for the interview.');
        }
    };

    const startInterviewSession = async () => {
        try {
            // 1. Create Session
            const createRes = await authFetchJson('/interviews/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    type: job?.aiInterviewConfig?.interviewType || 'BEHAVIORAL',
                    targetRole: job?.title || 'Candidate',
                    difficulty: job?.aiInterviewConfig?.difficulty || 'MEDIUM',
                    format: 'VIDEO',
                    jobId: job?.id
                })
            });

            if (createRes.error || !createRes.data) throw new Error(createRes.error || 'Failed to create session');
            const newSessionId = createRes.data.id;
            setSession(createRes.data);

            // 2. Start Session (generate questions)
            const startRes = await authFetchJson(`/interviews/sessions/${newSessionId}/start`, { method: 'POST' });
            if (startRes.error || !startRes.data) throw new Error(startRes.error || 'Failed to start session');

            setQuestions(startRes.data.questions);
            setCurrentQuestionIndex(startRes.data.currentQuestionIndex || 0);

        } catch (err: any) {
            setErrorMsg(err.message);
            setViewState('error');
        }
    };

    const toggleRecording = () => {
        if (!isRecording) {
            // Start
            setLiveTranscript('');
            finalTranscriptRef.current = '';
            recordingStartTimeRef.current = Date.now();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) { console.warn("Recognition already started or error"); }
            }
            setIsRecording(true);
        } else {
            // Stop and Submit
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
            submitAnswer();
        }
    };

    const submitAnswer = async () => {
        if (!session) return;

        try {
            setViewState('loading'); // Show brief loading overlay if desired, or just disable buttons

            const durationMinutes = (Date.now() - recordingStartTimeRef.current) / 1000 / 60;
            const finalString = finalTranscriptRef.current.trim() || liveTranscript.trim() || '(No speech detected)';
            const wordCount = finalString.split(/\s+/).filter(w => w.length > 0).length;
            const currentWpm = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

            const currentQ = questions[currentQuestionIndex];

            const submitRes = await authFetchJson(`/interviews/sessions/${session.id}/answer/video`, {
                method: 'POST',
                body: JSON.stringify({
                    questionId: currentQ.id,
                    transcript: finalString,
                    metrics: {
                        wpm: currentWpm,
                        eyeContactScore: Math.floor(Math.random() * 20) + 75, // Mocked 75-95%
                        sentiment: 'focused',
                        finalCode: currentQ.isCodingChallenge ? codeValue : undefined
                    }
                })
            });

            if (submitRes.error) throw new Error(submitRes.error);

            const resultData = submitRes.data;

            if (resultData.isComplete) {
                // Call complete
                await authFetch(`/interviews/sessions/${session.id}/complete`, { method: 'POST' });
                setViewState('completed');

                // Cleanup media
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                }
            } else {
                // Move to next question
                setCurrentQuestionIndex(prev => prev + 1);
                setLiveTranscript('');
                finalTranscriptRef.current = '';
                setViewState('interview');
            }

        } catch (err: any) {
            alert("Error submitting answer: " + err.message);
            setViewState('interview'); // Allow retry
        }
    };

    // Render blocks
    if (viewState === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    const org = job?.recruiter?.organization;
    const isBranded = org?.isWhiteLabel && !!org?.theme;
    const primaryColor = isBranded ? org.theme.primaryColor || '#4f46e5' : '#4f46e5';
    // Provide a style object full of CSS variables if we want fully custom, 
    // but here we can just use inline styles for the main buttons/accents.
    const customStyle = isBranded ? { '--color-primary': primaryColor } as React.CSSProperties : {};

    if (viewState === 'error') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMsg}</p>
                    <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    if (viewState === 'welcome') {
        const orgName = org?.name || 'the company';
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6" style={customStyle}>
                <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 sm:p-12">
                        {isBranded && org?.logoUrl ? (
                            <img src={org.logoUrl} alt={orgName} className="h-16 object-contain mb-6" />
                        ) : (
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <Camera className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Interview Invitation
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                            You have been invited to an asynchronous video interview for the position of <strong className="text-gray-900 dark:text-white">{job?.title}</strong> by <strong className="text-gray-900 dark:text-white">{orgName}</strong>.
                        </p>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">1</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Prepare your environment</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Ensure you are in a quiet place with good lighting.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">2</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Check equipment</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">You will need a working camera and microphone.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">3</div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Answer questions</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Read the questions on screen and record your response.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={setupDevices}
                            className="w-full py-4 text-white rounded-xl font-bold text-lg transition-opacity hover:opacity-90 flex justify-center items-center gap-2"
                            style={isBranded ? { backgroundColor: primaryColor } : { backgroundColor: '#4f46e5' }}
                        >
                            Continue to Device Setup <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewState === 'completed') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Interview Completed</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Thank you for completing your interview. The recruitment team at {job?.recruiter?.organization?.name || 'the company'} will review your responses and get back to you soon.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-screen bg-gray-950 overflow-hidden" style={customStyle}>
            {/* Header */}
            <header className="px-6 py-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center text-white z-10">
                <div className="flex items-center gap-4">
                    {isBranded && org?.logoUrl && (
                        <img src={org.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                    )}
                    <div>
                        <h1 className="font-bold text-lg">{job?.title} Interview</h1>
                        <p className="text-sm text-gray-400">{org?.name || 'Company'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium bg-gray-800 px-3 py-1 rounded-full">
                        Question {currentQuestionIndex + 1} of {questions.length || '?'}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 relative flex items-center justify-center p-6 z-0">
                {/* Video Feed & Editor */}
                {currentQuestion?.isCodingChallenge ? (
                    <div className="absolute inset-0 flex h-full w-full bg-gray-950">
                        {/* Left Side: Code Editor */}
                        <div className="w-1/2 h-full bg-[#1e1e1e] border-r border-gray-800 flex flex-col pointer-events-auto z-20 shadow-2xl">
                            <div className="px-5 py-3 bg-[#1e1e1e] border-b border-gray-800 flex justify-between items-center text-xs text-gray-400 font-mono shadow-sm">
                                <span className="flex items-center gap-2 text-indigo-400 font-bold"><Code2 className="w-4 h-4" /> code.js</span>
                            </div>
                            <div className="flex-1">
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language="javascript"
                                    value={codeValue}
                                    onChange={(value) => setCodeValue(value || "")}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 15,
                                        wordWrap: "on",
                                        padding: { top: 24, bottom: 24 },
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        cursorBlinking: "smooth",
                                        smoothScrolling: true
                                    }}
                                />
                            </div>
                        </div>

                        {/* Right Side: Camera */}
                        <div className="w-1/2 h-full relative bg-gray-950 overflow-hidden flex flex-col">
                            <video
                                ref={videoRef}
                                className="min-w-full min-h-full object-cover opacity-70"
                                autoPlay
                                muted
                                playsInline
                            />
                            {/* Inner gradient overlay for text readability over video */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent pointer-events-none" />
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                        <video
                            ref={videoRef}
                            className="min-w-full min-h-full object-cover opacity-80"
                            autoPlay
                            muted
                            playsInline
                        />
                    </div>
                )}

                {/* Overlays */}
                <div className="relative z-10 w-full max-w-4xl flex flex-col h-full justify-between pointer-events-none">

                    {/* Top: Current Question */}
                    <div className="mt-8 relative max-w-3xl mx-auto w-full group pointer-events-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative px-8 py-6 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
                            <span className="uppercase text-xs font-bold tracking-wider text-indigo-400 mb-2 block">Current Question</span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                                {currentQuestion?.questionText || 'Loading next question...'}
                            </h2>
                        </div>
                    </div>

                    {/* Bottom: Recording Controls & Live Transcript */}
                    <div className="mb-4 flex flex-col items-center pointer-events-auto gap-6 w-full">

                        {/* Live Transcript Bubble */}
                        {isRecording && liveTranscript && (
                            <div className="w-full max-w-2xl bg-black/60 backdrop-blur-md rounded-xl p-4 border border-gray-700 text-center animate-in fade-in slide-in-from-bottom-4">
                                <p className="text-gray-200 text-lg leading-relaxed italic">"{liveTranscript}"</p>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="bg-gray-900/90 backdrop-blur-xl p-4 rounded-3xl border border-gray-800 flex items-center gap-6 shadow-2xl">
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-2xl border border-gray-700 text-white">
                                <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                                <span className="font-mono text-sm tracking-wider">
                                    {isRecording ? 'RECORDING' : 'READY'}
                                </span>
                            </div>

                            <button
                                onClick={toggleRecording}
                                style={isRecording ? { backgroundColor: '#e11d48' } : (isBranded ? { backgroundColor: primaryColor } : { backgroundColor: '#4f46e5' })}
                                className={`h-16 px-8 rounded-2xl font-bold text-lg flex items-center gap-3 transition-opacity hover:opacity-90 active:scale-95 shadow-xl text-white`}
                            >
                                {isRecording ? (
                                    <>
                                        <Square className="w-6 h-6 fill-current" />
                                        Complete Answer
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-6 h-6 fill-current" />
                                        Start Answering
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
