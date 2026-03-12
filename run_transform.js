const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('d:/Coding/SmartCareerAI/frontend/src/app/(main)/dashboard/interviews/[id]/room/page.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Imports
content = content.replace(
    /import \{ useVideoRecorder, formatVideoTime \} from '@\/hooks\/useVideoRecorder';\nimport \{ useSpeechRecognition \} from '@\/hooks\/use-speech-recognition';/,
    `import { useVideoRecorder } from '@/hooks/useVideoRecorder';\nimport { useInterviewFlow } from '@/hooks/useInterviewFlow';`
);

// 2. States
content = content.replace(
    /const \[submitting, setSubmitting\] = useState\(false\);\n    const \[currentQuestionIndex, setCurrentQuestionIndex\] = useState\(0\);\n    const \[aiHint, setAiHint\] = useState<AIHint \| null>\(null\);\n    const \[loadingHint, setLoadingHint\] = useState\(false\);\n    const \[analytics, setAnalytics\] = useState<LiveAnalytics \| null>\(null\);\n    const \[transcript, setTranscript\] = useState<string>\(''\);/,
    `const [aiHint, setAiHint] = useState<AIHint | null>(null);\n    const [loadingHint, setLoadingHint] = useState(false);\n    const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);`
);

// 3. Hooks & Video Replace
const hooksRegex = /\/\/ Video recording hook[\s\S]*?const faceAnalysis = useFaceAnalysis\(videoPreviewRef\);/;
content = content.replace(hooksRegex, `// Helper to get camera preview going
    const { previewStream, startPreview, stopPreview } = useVideoRecorder({ maxDuration: 180 });
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    // Client-side Analysis
    const faceAnalysis = useFaceAnalysis(videoPreviewRef);

    const onAnswerSubmit = useCallback(async (index: number, currentTranscript: string) => {
        if (!session) return false;
        const question = session.questions[index];
        if (!question) return false;
        
        try {
            // Submit to standard text answer endpoint since we are not recording video files anymore
            const response = await authFetch(\`/interviews/sessions/\${sessionId}/answer\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.id,
                    answer: currentTranscript || '[Silence]'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                setSession(prev => {
                    if (!prev) return null;
                    const updatedQs = [...prev.questions];
                    updatedQs[index] = {
                        ...updatedQs[index],
                        userAnswer: currentTranscript,
                        score: data.data.evaluation?.score || null,
                        feedback: data.data.evaluation?.feedback || null
                    };
                    return { ...prev, questions: updatedQs };
                });
                
                setAiHint(null);
                fetchAnalytics(); // Refresh analytics
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to submit answer:', err);
            return false;
        }
    }, [session, sessionId, faceAnalysis.metrics]);

    const handleInterviewComplete = useCallback(async () => {
        // We will call endSession in an effect or directly when finished
    }, []);

    const {
        currentQuestionIndex,
        isSubmitting,
        isFinished,
        timeRemainingMs,
        transcript,
        wpm,
        isListening: isRecording,
        startInterview: startContinuousInterview,
        advanceQuestion,
        stopInterview
    } = useInterviewFlow({
        totalQuestions: session?.questions.length || 1,
        onAnswerSubmit,
        onInterviewComplete: handleInterviewComplete,
        timeLimitMs: 180000,
        silenceThresholdMs: 5000
    });`);

// 4. Sync Effects
const effectsRegex = /\/\/ Sync isRecording with Analysis[\s\S]*?\[speech\.transcript, speech\.wpm, faceAnalysis\.metrics\.sentiment, faceAnalysis\.metrics\.isFaceDetected, isRecording\]\);/;
content = content.replace(effectsRegex, `// Sync isRecording with Analysis
    useEffect(() => {
        if (isRecording) {
            faceAnalysis.startAnalysis();
        } else {
            faceAnalysis.stopAnalysis();
        }
    }, [isRecording, faceAnalysis]);

    // Sync Metrics to UI
    useEffect(() => {
        if (isRecording) {
            if (wpm > 0) {
                setSpeechPacing({
                    wpm,
                    label: wpm < 110 ? 'Slow' : wpm > 160 ? 'Fast' : 'Good'
                });
            }

            if (faceAnalysis.metrics.isFaceDetected) {
                setSentiment({
                    type: faceAnalysis.metrics.sentiment,
                    label: faceAnalysis.metrics.sentiment.charAt(0).toUpperCase() + faceAnalysis.metrics.sentiment.slice(1)
                });
            }
        }
    }, [wpm, faceAnalysis.metrics.sentiment, faceAnalysis.metrics.isFaceDetected, isRecording]);`);

// 5. Remove submitVideoAnswer
content = content.replace(/const submitVideoAnswer = async \(\) => \{[\s\S]*?const endSession = async/m, `const endSession = async`);

// 6. Formatting Time helper (because we removed formatVideoTime)
content = content.replace(/import \{ useAuthStore \} from '@\/store\/auth\.store';/g, `import { useAuthStore } from '@/store/auth.store';\nconst formatTimeMs = (ms: number) => { const s = Math.floor(ms/1000); const m = Math.floor(s/60); return \`\${m.toString().padStart(2, '0')}:\${(s%60).toString().padStart(2, '0')}\`; };`);

// 7. Update formatVideoTime in JSX
content = content.replace(/REC \{formatVideoTime\(recordingTime\)\}/g, 'REC {formatTimeMs(timeLimitMs - timeRemainingMs)}');
content = content.replace(/REC • \{formatElapsedTime\(elapsedTime\)\}/g, 'REC • {formatTimeMs(timeLimitMs - timeRemainingMs)}');

// 8. Start/End Interview Handlers
const handlersRegex = /\/\/ Start interview after all permissions granted[\s\S]*?const handleEndInterview = async \(\) => \{[\s\S]*?await endSession\(\);\n    \};/;
content = content.replace(handlersRegex, `// Start interview after all permissions granted
    const handleStartInterview = async () => {
        if (allRequirementsMet && agreedToGuidelines) {
            await proctoringControls.enterFullscreen();
            setShowProctoringModal(false);
            setTimeout(() => {
                startContinuousInterview();
            }, 1000);
        }
    };

    // Handle interview end with fullscreen exit
    const handleEndInterview = async () => {
        stopInterview();
        await proctoringControls.exitFullscreen();
        proctoringControls.stopAllStreams();
        await endSession();
    };
    
    useEffect(() => {
        if (isFinished) {
            handleEndInterview();
        }
    }, [isFinished]);`);

// 9. Fix the time remaining display
content = content.replace(/formatTimeMs\(timeLimitMs - timeRemainingMs\)/g, 'formatTimeMs(180000 - timeRemainingMs)'); // quick fix since we don't have timeLimitMs in JSX scope

// 10. Recording Controls UI Replacements
const controlsRegex = /\/\/ Recording Controls[\s\S]*?<\/div>\n\n                    \/\/ Bottom Metrics/m;
content = content.replace(controlsRegex, `// Recording Controls
                    <div className="flex items-center justify-center gap-4 py-4">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={\`w-12 h-12 rounded-full flex items-center justify-center transition \${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'}\`}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <Video className="w-5 h-5" />
                        </button>

                        <div className="w-px h-8 bg-gray-300 dark:bg-white/10" />

                        {isRecording && (
                            <button
                                onClick={advanceQuestion}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                Next Question
                            </button>
                        )}
                    </div>

                    {/* Bottom Metrics`);

fs.writeFileSync(targetPath, content);
console.log('Transformation complete!');
