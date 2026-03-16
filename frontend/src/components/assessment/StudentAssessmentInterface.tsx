'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { AlertCircle, Clock, Shield, CheckCircle, Video, VideoOff } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';
import { useProctoringCamera } from '@/hooks/useProctoringCamera';

interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'OPEN_ENDED' | 'TRUE_FALSE';
    options?: string[];
    category?: string;
}

interface AssessmentState {
    questions: Question[];
    currentQuestionIndex: number;
    answers: Record<string, string>;
    timeLeft: number;
    isCompleted: boolean;
    isStarted: boolean;
    jobTitle: string;
    durationMinutes: number;
    cutoffScore?: number;
}

export const StudentAssessmentInterface = ({ attemptId }: { attemptId: string }) => {
    const [state, setState] = useState<AssessmentState>({
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        timeLeft: 0,
        isCompleted: false,
        isStarted: false,
        jobTitle: '',
        durationMinutes: 30,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { state: camState, videoRef, startCamera, startInterval, stopCamera } = useProctoringCamera(attemptId);
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Fetch attempt data on mount
    useEffect(() => {
        authFetch(`/assessments/attempts/${attemptId}`)
            .then(r => r.json())
            .then(({ data }) => {
                if (!data) throw new Error('Attempt not found');
                if (data.status !== 'IN_PROGRESS') {
                    setState(s => ({ ...s, isCompleted: true }));
                    return;
                }
                setState(s => ({
                    ...s,
                    questions: data.questions ?? [],
                    timeLeft: (data.template?.durationMinutes ?? 30) * 60,
                    durationMinutes: data.template?.durationMinutes ?? 30,
                    jobTitle: data.template?.job?.title ?? '',
                    cutoffScore: data.template?.cutoffScore,
                }));
            })
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, [attemptId]);

    const logEvent = useCallback((type: string, metadata: object) => {
        authFetch(`/assessments/attempts/${attemptId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, metadata }),
        }).catch(() => { });
    }, [attemptId]);

    const submitAnswers = useCallback(async (answers: Record<string, string>) => {
        if (timerRef.current) clearInterval(timerRef.current);
        const payload = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
        await authFetch(`/assessments/attempts/${attemptId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: payload }),
        });
        setState(s => ({ ...s, isCompleted: true }));
        stopCamera();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    }, [attemptId, stopCamera]);

    // Countdown timer
    useEffect(() => {
        if (!state.isStarted || state.isCompleted) return;
        timerRef.current = setInterval(() => {
            setState(s => {
                if (s.timeLeft <= 1) {
                    clearInterval(timerRef.current!);
                    submitAnswers(stateRef.current.answers).catch(() => { });
                    return { ...s, timeLeft: 0 };
                }
                return { ...s, timeLeft: s.timeLeft - 1 };
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [state.isStarted, state.isCompleted, submitAnswers]);

    // Tab switch detection
    useEffect(() => {
        if (!state.isStarted) return;
        const handler = () => { if (document.hidden) logEvent('TAB_SWITCH', {}); };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [state.isStarted, logEvent]);

    // Fullscreen change detection
    useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement && stateRef.current.isStarted && !stateRef.current.isCompleted) {
                setShowFullscreenWarning(true);
                logEvent('EXIT_FULLSCREEN', {});
            } else if (document.fullscreenElement) {
                setShowFullscreenWarning(false);
            }
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, [logEvent]);

    // Prevent accidental navigation
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (state.isStarted && !state.isCompleted) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [state.isStarted, state.isCompleted]);

    const startAssessment = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setState(s => ({ ...s, isStarted: true }));
            // Start camera for proctoring
            const cameraOk = await startCamera();
            if (cameraOk) startInterval();
        } catch {
            alert('Please allow full-screen mode to start the assessment.');
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await submitAnswers(state.answers);
        } catch {
            alert('Failed to submit. Please try again.');
            setSubmitting(false);
        }
    };

    const handleAnswerChange = (val: string) => {
        const qId = state.questions[state.currentQuestionIndex]?.id;
        if (!qId) return;
        setState(s => ({ ...s, answers: { ...s.answers, [qId]: val } }));
    };

    const fmt = (secs: number) =>
        `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

    if (loading) return <div className="p-12 text-center text-muted-foreground">Loading assessment…</div>;
    if (error) return <div className="p-12 text-center text-destructive">Error: {error}</div>;

    if (state.isCompleted) {
        return (
            <div className="max-w-lg mx-auto text-center space-y-4 p-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">Assessment Submitted</h2>
                <p className="text-muted-foreground">Your responses have been recorded. Results will be shared by the recruiter.</p>
            </div>
        );
    }

    if (showFullscreenWarning) {
        return (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-destructive/50 shadow-2xl">
                    <CardHeader className="text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-2xl text-destructive">Full-Screen Required</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-muted-foreground">You must stay in full-screen mode during the assessment.</p>
                        <Button size="lg" className="w-full" onClick={async () => {
                            await document.documentElement.requestFullscreen();
                            setShowFullscreenWarning(false);
                        }}>
                            Return to Assessment
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    const progress = state.questions.length
        ? (state.currentQuestionIndex / state.questions.length) * 100
        : 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6 relative">
            {/* F16: Live webcam preview tile (bottom-right, fixed during assessment) */}
            {state.isStarted && (
                <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-1">
                    <div className={`rounded-xl overflow-hidden border-2 shadow-2xl ${camState.cameraActive ? 'border-red-500' : 'border-gray-500 bg-gray-800'}`} style={{ width: 96, height: 72 }}>
                        {/* videoRef is set by useProctoringCamera; always render it so the hook can assign srcObject */}
                        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${camState.cameraActive ? '' : 'hidden'}`} />
                        {!camState.cameraActive && (
                            <div className="w-full h-full flex items-center justify-center">
                                <VideoOff className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                    </div>
                    {camState.cameraActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>
            )}

            {/* F16: Camera monitoring banner */}
            {state.isStarted && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${camState.cameraActive ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                    {camState.cameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    {camState.cameraActive ? 'Camera active — you are being monitored' : (camState.error || 'Camera not available — proctoring may be limited')}
                </div>
            )}

            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">Proctored{state.jobTitle ? ` — ${state.jobTitle}` : ''}</span>
                    </div>
                    {state.cutoffScore && (
                        <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                            Passing Cutoff: {state.cutoffScore}%
                        </div>
                    )}
                    {state.isStarted && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span className={`font-mono text-lg font-bold ${state.timeLeft < 120 ? 'text-destructive' : ''}`}>
                                {fmt(state.timeLeft)}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {state.isStarted && <Progress value={progress} />}

            {!state.isStarted ? (
                <div className="p-12 text-center space-y-4">
                    <p className="text-muted-foreground">
                        {state.questions.length} questions · {state.durationMinutes} minutes · Fullscreen proctored
                        {state.cutoffScore && <span className="block mt-1 text-amber-600 dark:text-amber-400 font-bold">Passing Criteria: {state.cutoffScore}%</span>}
                    </p>
                    <Button size="lg" onClick={startAssessment}>Start Assessment</Button>
                    <p className="text-xs text-muted-foreground">Do not switch tabs or exit full-screen once started.</p>
                </div>
            ) : currentQuestion ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Question {state.currentQuestionIndex + 1} of {state.questions.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-lg">{currentQuestion.text}</p>

                        {currentQuestion.type === 'MCQ' || currentQuestion.type === 'TRUE_FALSE' ? (
                            <RadioGroup
                                value={state.answers[currentQuestion.id] ?? ''}
                                onValueChange={handleAnswerChange}
                            >
                                {(currentQuestion.options ?? []).map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                                        <RadioGroupItem value={opt} id={`opt-${i}`} />
                                        <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        ) : (
                            <Textarea
                                placeholder="Type your response here…"
                                className="min-h-[200px]"
                                value={state.answers[currentQuestion.id] ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(e.target.value)}
                            />
                        )}

                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                disabled={state.currentQuestionIndex === 0}
                                onClick={() => setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex - 1 }))}
                            >
                                Previous
                            </Button>
                            {state.currentQuestionIndex === state.questions.length - 1 ? (
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Submitting…' : 'Submit Assessment'}
                                </Button>
                            ) : (
                                <Button onClick={() => setState(s => ({ ...s, currentQuestionIndex: s.currentQuestionIndex + 1 }))}>
                                    Next Question
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
};
