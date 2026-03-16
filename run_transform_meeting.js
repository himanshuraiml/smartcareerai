const fs = require('fs');

const path = 'frontend/src/components/meeting/MeetingRoom.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
let newLines = [];
let importsAdded = false;
let hooksAdded = false;
let handleEndCallModified = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Add Imports
    if (!importsAdded && line.includes('import { useMediaSoup }')) {
        newLines.push('import { useFaceAnalysis } from "@/hooks/use-face-analysis";');
        newLines.push('import { useSpeechRecognition } from "@/hooks/use-speech-recognition";');
        newLines.push(line);
        importsAdded = true;
        continue;
    }

    // 2. Add Hooks inside MeetingRoom
    if (!hooksAdded && line.includes('const mediasoup = useMediaSoup')) {
        newLines.push(`    // Behavior Analysis for Candidate
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const speech = useSpeechRecognition();
    const faceAnalysis = useFaceAnalysis(localVideoRef);

    // Sync isRecording with Analysis when joined
    useEffect(() => {
        if (joined && role === 'CANDIDATE') {
            speech.startListening();
            faceAnalysis.startAnalysis();
        } else {
            speech.stopListening();
            faceAnalysis.stopAnalysis();
        }
        
        return () => {
             speech.stopListening();
             faceAnalysis.stopAnalysis();
        };
    }, [joined, role]);`);
        newLines.push(line);
        hooksAdded = true;
        continue;
    }

    // 3. Modify handleEndCall to submit metrics
    if (!handleEndCallModified && line.includes('const handleEndCall = async () => {')) {
        newLines.push(`    const handleEndCall = async () => {
        if (role === 'CANDIDATE') {
            try {
                // Submit behavior metrics before leaving
                const metrics = {
                    wpm: speech.wpm,
                    eyeContactScore: faceAnalysis.metrics.eyeContactScore,
                    sentiment: faceAnalysis.metrics.sentiment,
                    detectedKeywords: [] // Optional
                };
                await authFetch(\`/interviews/sessions/\${meetingId}/behavior-metrics\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ metrics })
                });
            } catch (err) {
                console.error('Failed to save behavior metrics:', err);
            }
        }`);
        handleEndCallModified = true;
        continue;
    }

    // 4. Pass localVideoRef to the local VideoTile
    if (line.includes('isLocal') && lines[i - 1] && lines[i - 1].includes('handRaised={handRaised}') && !line.includes('/>')) {
        newLines.push(line);
        newLines.push('                                videoRef={localVideoRef}');
        continue;
    }

    // In thumbnail strip
    if (line.includes('isLocal') && lines[i + 1] && lines[i + 1].includes('/>') && lines[i - 2] && lines[i - 2].includes('isMuted={mediasoup.audioMuted}')) {
        newLines.push(line);
        newLines.push('                                    videoRef={localVideoRef}');
        continue;
    }

    newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('MeetingRoom behavior logic injected');
