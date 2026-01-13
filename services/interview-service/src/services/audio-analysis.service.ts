import { logger } from '../utils/logger';
import { whisperService, TranscriptionResult, FillerWordAnalysis } from './whisper.service';

export interface AudioAnalysisResult {
    transcription: TranscriptionResult;
    fillerWordAnalysis: FillerWordAnalysis;
    speakingPace: {
        wordsPerMinute: number;
        rating: string;
        feedback: string;
    };
    clarityScore: number;
    confidenceIndicators: {
        hesitationLevel: string;
        fillerWordImpact: string;
        overallConfidence: number;
    };
    suggestions: string[];
}

export class AudioAnalysisService {
    /**
     * Perform comprehensive audio analysis
     */
    async analyzeAudio(audioBuffer: Buffer, filename: string): Promise<AudioAnalysisResult> {
        logger.info('Starting comprehensive audio analysis...');

        // Step 1: Transcribe audio
        const transcription = await whisperService.transcribeAudio(audioBuffer, filename);

        // Step 2: Analyze filler words
        const fillerWordAnalysis = whisperService.analyzeFillerWords(transcription.text);

        // Step 3: Get speaking pace feedback
        const paceFeedback = whisperService.getSpeakingPaceFeedback(transcription.wordsPerMinute);

        // Step 4: Calculate clarity score (based on filler words and pace)
        const clarityScore = this.calculateClarityScore(
            fillerWordAnalysis.fillerWordPercentage,
            transcription.wordsPerMinute
        );

        // Step 5: Determine confidence indicators
        const confidenceIndicators = this.analyzeConfidence(
            fillerWordAnalysis,
            transcription.wordsPerMinute
        );

        // Step 6: Generate suggestions
        const suggestions = this.generateSuggestions(
            fillerWordAnalysis,
            transcription.wordsPerMinute,
            clarityScore
        );

        logger.info(`Audio analysis complete. Clarity score: ${clarityScore}`);

        return {
            transcription,
            fillerWordAnalysis,
            speakingPace: {
                wordsPerMinute: transcription.wordsPerMinute,
                ...paceFeedback,
            },
            clarityScore,
            confidenceIndicators,
            suggestions,
        };
    }

    /**
     * Calculate clarity score (0-100)
     */
    private calculateClarityScore(fillerPercentage: number, wpm: number): number {
        let score = 100;

        // Deduct for filler words (up to 30 points)
        if (fillerPercentage > 0) {
            score -= Math.min(fillerPercentage * 3, 30);
        }

        // Deduct for pace issues (up to 20 points)
        if (wpm < 100) {
            score -= Math.min((100 - wpm) / 5, 15);
        } else if (wpm > 180) {
            score -= Math.min((wpm - 180) / 5, 20);
        }

        return Math.max(0, Math.round(score));
    }

    /**
     * Analyze confidence indicators
     */
    private analyzeConfidence(
        fillerAnalysis: FillerWordAnalysis,
        wpm: number
    ): { hesitationLevel: string; fillerWordImpact: string; overallConfidence: number } {
        // Hesitation level based on filler words like "um", "uh"
        const hesitationFillers = fillerAnalysis.fillerWords.filter(
            f => ['um', 'uh'].includes(f.word.toLowerCase())
        );
        const hesitationCount = hesitationFillers.reduce((sum, f) => sum + f.count, 0);

        let hesitationLevel: string;
        if (hesitationCount === 0) {
            hesitationLevel = 'minimal';
        } else if (hesitationCount <= 3) {
            hesitationLevel = 'low';
        } else if (hesitationCount <= 7) {
            hesitationLevel = 'moderate';
        } else {
            hesitationLevel = 'high';
        }

        // Filler word impact
        let fillerWordImpact: string;
        if (fillerAnalysis.fillerWordPercentage < 2) {
            fillerWordImpact = 'none';
        } else if (fillerAnalysis.fillerWordPercentage < 5) {
            fillerWordImpact = 'low';
        } else if (fillerAnalysis.fillerWordPercentage < 10) {
            fillerWordImpact = 'moderate';
        } else {
            fillerWordImpact = 'significant';
        }

        // Calculate overall confidence score
        let confidence = 85;

        // Adjust based on hesitation
        if (hesitationLevel === 'high') confidence -= 20;
        else if (hesitationLevel === 'moderate') confidence -= 10;
        else if (hesitationLevel === 'low') confidence -= 5;

        // Adjust based on filler impact
        if (fillerWordImpact === 'significant') confidence -= 15;
        else if (fillerWordImpact === 'moderate') confidence -= 8;
        else if (fillerWordImpact === 'low') confidence -= 3;

        // Adjust based on speaking pace
        if (wpm < 100 || wpm > 200) confidence -= 10;
        else if (wpm < 120 || wpm > 180) confidence -= 5;

        return {
            hesitationLevel,
            fillerWordImpact,
            overallConfidence: Math.max(0, Math.min(100, confidence)),
        };
    }

    /**
     * Generate improvement suggestions
     */
    private generateSuggestions(
        fillerAnalysis: FillerWordAnalysis,
        wpm: number,
        clarityScore: number
    ): string[] {
        const suggestions: string[] = [];

        // Filler word suggestions
        if (fillerAnalysis.totalFillerWords > 5) {
            const topFillers = fillerAnalysis.fillerWords.slice(0, 3).map(f => f.word);
            suggestions.push(
                `Try to reduce filler words like "${topFillers.join('", "')}". ` +
                `Practice pausing briefly instead of using filler words.`
            );
        }

        if (fillerAnalysis.fillerWords.some(f => ['um', 'uh'].includes(f.word.toLowerCase()) && f.count > 3)) {
            suggestions.push(
                `You used "um" or "uh" frequently. When you need a moment to think, ` +
                `try taking a silent pause instead - it sounds more confident.`
            );
        }

        // Pace suggestions
        if (wpm < 100) {
            suggestions.push(
                `Your speaking pace is slower than typical (${wpm} WPM). ` +
                `Try practicing with a timer to increase your pace slightly for better engagement.`
            );
        } else if (wpm > 180) {
            suggestions.push(
                `You're speaking quite fast (${wpm} WPM). ` +
                `Slow down a bit to give your points more impact and help listeners follow along.`
            );
        }

        // General suggestions based on clarity score
        if (clarityScore >= 85) {
            suggestions.push(
                `Great job! Your verbal communication is clear and confident. ` +
                `Keep practicing to maintain this level.`
            );
        } else if (clarityScore >= 70) {
            suggestions.push(
                `Your communication is good. Focus on the specific areas noted above to improve further.`
            );
        } else {
            suggestions.push(
                `Practice speaking more deliberately and prepare your key points in advance. ` +
                `Recording yourself and listening back can help identify areas for improvement.`
            );
        }

        return suggestions;
    }
}

export const audioAnalysisService = new AudioAnalysisService();
