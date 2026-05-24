import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechRecognition } from './use-speech-recognition';

interface UseInterviewFlowProps {
    totalQuestions: number;
    onAnswerSubmit: (questionIndex: number, transcript: string) => Promise<boolean>;
    onInterviewComplete: () => Promise<void>;
    timeLimitMs?: number;
    silenceThresholdMs?: number;
}

export function useInterviewFlow({
    totalQuestions,
    onAnswerSubmit,
    onInterviewComplete,
    timeLimitMs = 180000,
    silenceThresholdMs = 120000, // 2 min silence before auto-submit (effectively disabled)
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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionCountdown, setTransitionCountdown] = useState(3);
    // True once startInterview() has been called — drives the timer independently of speech API
    const [interviewStarted, setInterviewStarted] = useState(false);

    const lastTranscriptLengthRef = useRef(0);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const transitionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const latestTranscriptRef = useRef(transcript);
    const isSubmittingRef = useRef(false);
    const isTransitioningRef = useRef(false);

    useEffect(() => {
        latestTranscriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        isTransitioningRef.current = isTransitioning;
    }, [isTransitioning]);

    const advanceToNextQuestion = useCallback((nextIndex: number) => {
        if (transitionIntervalRef.current) clearInterval(transitionIntervalRef.current);
        setIsTransitioning(true);
        isTransitioningRef.current = true;
        setTransitionCountdown(3);

        let count = 3;
        transitionIntervalRef.current = setInterval(() => {
            count -= 1;
            setTransitionCountdown(count);
            if (count <= 0) {
                clearInterval(transitionIntervalRef.current!);
                setIsTransitioning(false);
                isTransitioningRef.current = false;
                setCurrentQuestionIndex(nextIndex);
                setTimeRemainingMs(timeLimitMs);
                resetTranscript();
                lastTranscriptLengthRef.current = 0;
            }
        }, 1000);
    }, [timeLimitMs, resetTranscript]);

    const submitCurrentQuestion = useCallback(async (_manual: boolean = false) => {
        if (isSubmittingRef.current || isFinished || isTransitioningRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        const currentTranscript = latestTranscriptRef.current;

        try {
            const shouldAdvance = await onAnswerSubmit(currentQuestionIndex, currentTranscript);

            if (shouldAdvance) {
                if (currentQuestionIndex < totalQuestions - 1) {
                    setIsSubmitting(false);
                    isSubmittingRef.current = false;
                    advanceToNextQuestion(currentQuestionIndex + 1);
                    return;
                } else {
                    setIsFinished(true);
                    stopListening();
                    await onInterviewComplete();
                }
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    }, [isFinished, currentQuestionIndex, totalQuestions, onAnswerSubmit, onInterviewComplete, stopListening, advanceToNextQuestion]);

    // Per-question countdown timer — driven by interviewStarted, NOT isListening
    // This prevents a momentary Speech API restart from pausing or resetting the clock
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (interviewStarted && !isSubmitting && !isFinished && !isTransitioning) {
            intervalRef.current = setInterval(() => {
                setTimeRemainingMs(prev => {
                    if (prev <= 1000) {
                        clearInterval(intervalRef.current!);
                        submitCurrentQuestion(false);
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [interviewStarted, isSubmitting, isFinished, isTransitioning, currentQuestionIndex, submitCurrentQuestion]);

    // Silence detection (with high threshold to avoid interfering with thinking pauses)
    useEffect(() => {
        if (isListening && !isSubmitting && !isFinished && !isTransitioning) {
            if (transcript.length > lastTranscriptLengthRef.current) {
                lastTranscriptLengthRef.current = transcript.length;
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                if (transcript.trim().length > 10) {
                    silenceTimerRef.current = setTimeout(() => {
                        submitCurrentQuestion(false);
                    }, silenceThresholdMs);
                }
            }
        }
        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [transcript, isListening, isSubmitting, isFinished, isTransitioning, submitCurrentQuestion, silenceThresholdMs]);

    const startInterview = useCallback(() => {
        setCurrentQuestionIndex(0);
        setTimeRemainingMs(timeLimitMs);
        setIsFinished(false);
        setIsSubmitting(false);
        setIsTransitioning(false);
        setInterviewStarted(true);
        resetTranscript();
        startListening();
    }, [startListening, resetTranscript, timeLimitMs]);

    return {
        currentQuestionIndex,
        isSubmitting,
        isFinished,
        isTransitioning,
        transitionCountdown,
        timeRemainingMs,
        timeLimitMs,
        transcript,
        wpm,
        isListening,
        isActive: interviewStarted && !isFinished, // timer/controls should show even if speech API restarts
        speechError,
        startInterview,
        advanceQuestion: () => submitCurrentQuestion(true),
        stopInterview: () => { setInterviewStarted(false); stopListening(); },
        setQuestionIndex: setCurrentQuestionIndex,
    };
}
