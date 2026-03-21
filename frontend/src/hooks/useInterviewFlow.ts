import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechRecognition } from './use-speech-recognition';

interface UseInterviewFlowProps {
    totalQuestions: number;
    onAnswerSubmit: (questionIndex: number, transcript: string) => Promise<boolean>; // Returns true if it should advance
    onInterviewComplete: () => Promise<void>;
    timeLimitMs?: number; // Max time per question (e.g., 180000 for 3 mins)
    silenceThresholdMs?: number; // Auto-submit if silent for this long (e.g., 5000)
}

export function useInterviewFlow({
    totalQuestions,
    onAnswerSubmit,
    onInterviewComplete,
    timeLimitMs = 180000,
    silenceThresholdMs = 5000
}: UseInterviewFlowProps) {
    const {
        transcript,
        isListening,
        wpm,
        error: speechError,
        startListening,
        stopListening,
        resetTranscript
    } = useSpeechRecognition();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [timeRemainingMs, setTimeRemainingMs] = useState(timeLimitMs);

    const lastTranscriptLengthRef = useRef(0);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const latestTranscriptRef = useRef(transcript);

    // Keep strict reference to transcript for timers
    useEffect(() => {
        latestTranscriptRef.current = transcript;
    }, [transcript]);

    const isSubmittingRef = useRef(false);

    const submitCurrentQuestion = useCallback(async (manual: boolean = false) => {
        if (isSubmittingRef.current || isFinished) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        // Stop timers
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        const currentTranscript = latestTranscriptRef.current;

        try {
            const shouldAdvance = await onAnswerSubmit(currentQuestionIndex, currentTranscript);

            if (shouldAdvance) {
                resetTranscript();
                lastTranscriptLengthRef.current = 0;

                if (currentQuestionIndex < totalQuestions - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setTimeRemainingMs(timeLimitMs);
                } else {
                    setIsFinished(true);
                    stopListening();
                    await onInterviewComplete();
                }
            }
        } catch (error) {
            console.error("Failed to submit answer:", error);
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    }, [isFinished, currentQuestionIndex, totalQuestions, onAnswerSubmit, onInterviewComplete, resetTranscript, stopListening, timeLimitMs]);

    // Timer countdown
    useEffect(() => {
        if (isListening && !isSubmitting && !isFinished) {
            intervalRef.current = setInterval(() => {
                setTimeRemainingMs(prev => {
                    if (prev <= 1000) {
                        clearInterval(intervalRef.current!);
                        submitCurrentQuestion(false); // Time Limit exceeded
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);

            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [isListening, isSubmitting, isFinished, submitCurrentQuestion]);

    // Silence detection
    useEffect(() => {
        if (isListening && !isSubmitting && !isFinished) {
            if (transcript.length > lastTranscriptLengthRef.current) {
                // User is talking, reset silence timer
                lastTranscriptLengthRef.current = transcript.length;

                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                // Only start detecting silence if they have spoken at least something significant
                if (transcript.trim().length > 10) {
                    silenceTimerRef.current = setTimeout(() => {
                        submitCurrentQuestion(false); // Silence detected
                    }, silenceThresholdMs);
                }
            }
        }

        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [transcript, isListening, isSubmitting, isFinished, submitCurrentQuestion, silenceThresholdMs]);

    // Helper to start the flow
    const startInterview = useCallback(() => {
        setCurrentQuestionIndex(0);
        setTimeRemainingMs(timeLimitMs);
        setIsFinished(false);
        setIsSubmitting(false);
        resetTranscript();
        startListening();
    }, [startListening, resetTranscript, timeLimitMs]);

    return {
        currentQuestionIndex,
        isSubmitting,
        isFinished,
        timeRemainingMs,
        transcript,
        wpm,
        isListening,
        speechError,
        startInterview,
        advanceQuestion: () => submitCurrentQuestion(true),
        stopInterview: stopListening,
        setQuestionIndex: setCurrentQuestionIndex
    };
}
