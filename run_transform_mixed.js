const fs = require('fs');

const path = 'frontend/src/app/(main)/dashboard/interviews/[id]/mixed-room/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
let newLines = [];
let inControls = false;
let inSubmitVideoAnswer = false;
let inHandleEndInterview = false;
let inHandleStartInterview = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove duplicates and unused states
    if (line.includes('const [transcript, setTranscript]')) continue;
    if (line.includes('const [submitting, setSubmitting]')) continue;
    if (line.includes('const [currentQuestionIndex, setCurrentQuestionIndex]')) continue;

    // Fix imports
    if (line.includes('import { useVideoRecorder, formatVideoTime } from')) {
        newLines.push('const formatTimeMs = (ms: number) => { const s = Math.floor(ms/1000); const m = Math.floor(s/60); return `${m.toString().padStart(2, "0")}:${(s%60).toString().padStart(2, "0")}`; };');
        newLines.push('import { useVideoRecorder } from "@/hooks/useVideoRecorder";');
        newLines.push('import { useInterviewFlow } from "@/hooks/useInterviewFlow";');
        continue;
    }

    if (line.includes('const formatTimeMs =')) continue;
    if (line.includes('import { useInterviewFlow }')) continue;
    if (line.includes('import { useVideoRecorder } from "@/hooks/useVideoRecorder"')) continue;

    // Remove isRecording from useVideoRecorder 
    if (line.trim() === 'isRecording,') continue;

    // Replace useEffect for speech metrics syncing
    if (line.includes('// Sync Metrics to UI and detect keywords')) {
        newLines.push(line);
        while (!lines[i + 1].includes('// Handle video preview stream')) {
            i++;
        }
        newLines.push('    useEffect(() => {');
        newLines.push('        if (isRecording && transcript) {');
        newLines.push('            // Detect mixed keywords');
        newLines.push('            const detected = new Set<string>();');
        newLines.push('            const lowerTranscript = transcript.toLowerCase();');
        newLines.push('            MIXED_KEYWORDS.forEach(keyword => {');
        newLines.push('                if (lowerTranscript.includes(keyword)) {');
        newLines.push('                    detected.add(keyword);');
        newLines.push('                }');
        newLines.push('            });');
        newLines.push('            setDetectedKeywords(detected);');
        newLines.push('            ');
        newLines.push('            if (wpm > 0) {');
        newLines.push('                setSpeechPacing({ wpm, label: wpm < 110 ? "Slow" : wpm > 160 ? "Fast" : "Good" });');
        newLines.push('            }');
        newLines.push('            ');
        newLines.push('            if (faceAnalysis.metrics.isFaceDetected) {');
        newLines.push('                setSentiment({');
        newLines.push('                    type: faceAnalysis.metrics.sentiment,');
        newLines.push('                    label: faceAnalysis.metrics.sentiment.charAt(0).toUpperCase() + faceAnalysis.metrics.sentiment.slice(1)');
        newLines.push('                });');
        newLines.push('            }');
        newLines.push('        }');
        newLines.push('    }, [transcript, wpm, faceAnalysis.metrics.sentiment, faceAnalysis.metrics.isFaceDetected, isRecording]);');
        newLines.push('');
        continue;
    }

    // Replace setCurrentQuestionIndex
    if (line.includes('setCurrentQuestionIndex(unansweredIndex);')) {
        newLines.push('                    setQuestionIndex(unansweredIndex);');
        continue;
    }

    // Replace submitVideoAnswer
    if (line.includes('const submitVideoAnswer = async () => {')) {
        inSubmitVideoAnswer = true;

        // This time, place the new hooks and methods where we are placing them safely
        newLines.push(`
    const onAnswerSubmit = useCallback(async (index: number, currentTranscript: string) => {
        if (!session) return false;
        const question = session.questions[index];
        if (!question) return false;
        
        try {
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
                
                // Refresh analytics
                fetchAnalytics();

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
                
                setDetectedKeywords(new Set());
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to submit answer:', err);
            return false;
        }
    }, [session, sessionId, fetchAnalytics]);

    const handleInterviewComplete = useCallback(async () => {
        // Will be called by effect on isFinished
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
        stopInterview,
        setQuestionIndex
    } = useInterviewFlow({
        totalQuestions: session?.questions.length || 1,
        onAnswerSubmit,
        onInterviewComplete: handleInterviewComplete,
        timeLimitMs: 180000,
        silenceThresholdMs: 5000
    });
`);
        continue;
    }

    if (inSubmitVideoAnswer) {
        if (line.includes('const endSession = async () => {')) {
            inSubmitVideoAnswer = false;
            newLines.push(line);
        }
        continue;
    }

    // Handle handleEndInterview
    if (line.includes('const handleEndInterview = async () => {')) {
        inHandleEndInterview = true;
        newLines.push('    // Handle interview end with fullscreen exit');
        newLines.push('    const handleEndInterview = async () => {');
        newLines.push('        stopInterview();');
        newLines.push('        await proctoringControls.exitFullscreen();');
        newLines.push('        proctoringControls.stopAllStreams();');
        newLines.push('        await endSession();');
        newLines.push('    };');
        newLines.push('    ');
        newLines.push('    useEffect(() => {');
        newLines.push('        if (isFinished) {');
        newLines.push('            handleEndInterview();');
        newLines.push('        }');
        newLines.push('    }, [isFinished]);');
        continue;
    }

    if (inHandleEndInterview) {
        // In mixed-room, the first 'if (something)' after handleEndInterview is 'if (loading)'
        if (line.includes('if (loading) {')) {
            inHandleEndInterview = false;
            newLines.push(line);
        }
        continue;
    }

    // Handle handleStartInterview
    if (line.includes('const handleStartInterview = async () => {')) {
        inHandleStartInterview = true;
        newLines.push('    // Start interview after all permissions granted');
        newLines.push('    const handleStartInterview = async () => {');
        newLines.push('        if (allRequirementsMet && agreedToGuidelines) {');
        newLines.push('            await proctoringControls.enterFullscreen();');
        newLines.push('            setShowProctoringModal(false);');
        newLines.push('            setTimeout(() => {');
        newLines.push('                startContinuousInterview();');
        newLines.push('            }, 1000);');
        newLines.push('        }');
        newLines.push('    };');
        continue;
    }

    if (inHandleStartInterview) {
        if (line.includes('// Handle interview end with fullscreen exit')) {
            inHandleStartInterview = false;
            newLines.push(line);
        }
        continue;
    }

    // Time replacement for UI
    if (line.includes('REC {formatVideoTime(recordingTime)}')) {
        newLines.push(line.replace('formatVideoTime(recordingTime)', 'formatTimeMs(180000 - timeRemainingMs)'));
        continue;
    }
    if (line.includes('REC • {formatElapsedTime(elapsedTime)}')) {
        newLines.push(line.replace('formatElapsedTime(elapsedTime)', 'formatTimeMs(180000 - timeRemainingMs)'));
        continue;
    }

    // Replace Recording Controls UI completely
    if (line.includes('{/* Recording Controls */}')) {
        inControls = true;
        newLines.push(line);
        newLines.push('                    <div className="flex items-center justify-center gap-4 py-4">');
        newLines.push('                        <button onClick={() => setIsMuted(!isMuted)} className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isMuted ? "bg-red-500/20 text-red-400" : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20"}`}>');
        newLines.push('                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}');
        newLines.push('                        </button>');
        newLines.push('                        <button className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 flex items-center justify-center transition">');
        newLines.push('                            <Video className="w-5 h-5" />');
        newLines.push('                        </button>');
        newLines.push('                        <div className="w-px h-8 bg-gray-300 dark:bg-white/10" />');
        newLines.push('                        {isRecording && (');
        newLines.push('                            <button onClick={advanceQuestion} disabled={isSubmitting} className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">');
        newLines.push('                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}');
        newLines.push('                                Next Question');
        newLines.push('                            </button>');
        newLines.push('                        )}');
        newLines.push('                    </div>');
        continue;
    }

    if (inControls) {
        // Notice in mixed-room, the next block might not be "Bottom Metrics", but I will match based on class
        if (line.includes('grid grid-cols-2 lg:grid-cols-4 gap-4')) {
            inControls = false;
            newLines.push('                    {/* Bottom Metrics */}');
            newLines.push(line);
        }
        else if (line.includes('{/* Bottom Metrics */}')) {
            inControls = false;
            newLines.push(line);
        }
        continue;
    }

    newLines.push(line);
}

// Ensure the hook order isn't broken
fs.writeFileSync(path, newLines.join('\n'));
console.log('Fixed mixed-room');
