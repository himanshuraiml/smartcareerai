const fs = require('fs');

const path = 'frontend/src/app/(main)/dashboard/interviews/[id]/room/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
let newLines = [];
let inControls = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove duplicates
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

    // Make sure we don't duplicate formatTimeMs if it was already injected
    if (line.includes('const formatTimeMs =')) continue;
    if (line.includes('import { useInterviewFlow }')) continue;
    if (line.includes('import { useVideoRecorder } from "@/hooks/useVideoRecorder"')) continue;

    // Replace Recording Controls
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
        if (line.includes('{/* Bottom Metrics */}')) {
            inControls = false;
            newLines.push(line);
        }
        continue;
    }

    newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Fixed');
