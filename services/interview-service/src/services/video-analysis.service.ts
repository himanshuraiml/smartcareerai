/**
 * Video Analysis Service
 * 
 * Provides visual analysis for video interviews including:
 * - Eye contact detection
 * - Facial expression analysis
 * - Body posture assessment
 * - Professional appearance evaluation
 * - Confidence level from visual cues
 * 
 * Integration: Gemini Vision API for frame-by-frame analysis
 */

import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Lazy initialize Gemini client (will be added when API key is provided)
let geminiClient: any = null;

function getGeminiClient(): any {
    if (!geminiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return null;
        }
        // TODO: Initialize Gemini client when API key is provided
        // import { GoogleGenerativeAI } from '@google/generative-ai';
        // geminiClient = new GoogleGenerativeAI(apiKey);
        logger.info('Gemini API key found - video analysis available');
    }
    return geminiClient;
}

export interface FrameAnalysisResult {
    eyeContact: {
        isLookingAtCamera: boolean;
        confidence: number;
    };
    facialExpression: {
        dominant: string;
        confidence: number;
        emotions: Record<string, number>;
    };
    bodyPosture: {
        isUpright: boolean;
        isCentered: boolean;
        notes: string;
    };
    professionalAppearance: {
        score: number;
        notes: string;
    };
}

export interface VideoAnalysisResult {
    isAvailable: boolean;
    message: string;
    visualAnalysis?: {
        eyeContact: {
            score: number;
            feedback: string;
            percentageLookingAtCamera: number;
        };
        facialExpressions: {
            dominantExpression: string;
            confidence: number;
            emotionBreakdown: Record<string, number>;
        };
        bodyPosture: {
            score: number;
            feedback: string;
            isUpright: boolean;
            isCentered: boolean;
        };
        professionalAppearance: {
            score: number;
            feedback: string;
        };
        overallVisualScore: number;
        suggestions: string[];
    };
}

export interface VideoFrame {
    timestamp: number;
    imageData: Buffer;
}

export class VideoAnalysisService {
    private isEnabled = false;
    private tempDir: string;

    constructor() {
        // Check if video analysis is enabled
        this.isEnabled = !!process.env.GEMINI_API_KEY;
        this.tempDir = path.join(__dirname, '../../temp/video');

        if (!this.isEnabled) {
            logger.info('Video analysis is disabled - GEMINI_API_KEY not configured');
        } else {
            logger.info('Video analysis is enabled with Gemini Vision');
        }
    }

    /**
     * Extract key frames from video for analysis
     * Requires fluent-ffmpeg to be properly configured
     */
    async extractKeyFrames(videoBuffer: Buffer, intervalSeconds: number = 5): Promise<VideoFrame[]> {
        logger.info('Extracting video frames...');

        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        // TODO: Implement with fluent-ffmpeg when ffmpeg is installed
        // const tempVideoPath = path.join(this.tempDir, `video_${Date.now()}.webm`);
        // fs.writeFileSync(tempVideoPath, videoBuffer);
        //
        // return new Promise((resolve, reject) => {
        //     const frames: VideoFrame[] = [];
        //     ffmpeg(tempVideoPath)
        //         .screenshots({
        //             count: 10,
        //             folder: this.tempDir,
        //             filename: 'frame_%i.jpg',
        //         })
        //         .on('end', () => {
        //             // Read frames and clean up
        //             resolve(frames);
        //         })
        //         .on('error', reject);
        // });

        return [];
    }

    /**
     * Analyze video for interview feedback
     */
    async analyzeVideo(videoBuffer: Buffer, filename: string): Promise<VideoAnalysisResult> {
        logger.info(`Video analysis requested for: ${filename}, size: ${videoBuffer.length} bytes`);

        if (!this.isEnabled) {
            return {
                isAvailable: false,
                message: 'Video analysis will be available soon! Add your GEMINI_API_KEY to enable visual feedback on eye contact, facial expressions, body posture, and professional appearance.',
            };
        }

        try {
            // Extract key frames from video
            const frames = await this.extractKeyFrames(videoBuffer);

            if (frames.length === 0) {
                return {
                    isAvailable: false,
                    message: 'Video received. Frame extraction requires ffmpeg - visual analysis will be available after setup.',
                };
            }

            // Analyze each frame
            const frameResults: FrameAnalysisResult[] = [];
            for (const frame of frames) {
                const result = await this.analyzeFrame(frame.imageData);
                if (result) {
                    frameResults.push(result);
                }
            }

            // Aggregate results across all frames
            const aggregatedResult = this.aggregateFrameResults(frameResults);

            return {
                isAvailable: true,
                message: 'Video analysis complete',
                visualAnalysis: aggregatedResult,
            };
        } catch (error: any) {
            logger.error('Video analysis error:', error.message);
            return {
                isAvailable: false,
                message: `Video analysis encountered an error: ${error.message}`,
            };
        }
    }

    /**
     * Analyze a single frame with Gemini Vision
     */
    async analyzeFrame(frameBuffer: Buffer): Promise<FrameAnalysisResult | null> {
        const client = getGeminiClient();
        if (!client) {
            return null;
        }

        try {
            // TODO: Implement with Gemini Vision API
            // const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
            // 
            // const prompt = `Analyze this interview video frame and provide detailed feedback.
            // Return a JSON object with the following structure:
            // {
            //     "eyeContact": {
            //         "isLookingAtCamera": boolean,
            //         "confidence": 0-100
            //     },
            //     "facialExpression": {
            //         "dominant": "confident|nervous|neutral|happy|focused",
            //         "confidence": 0-100,
            //         "emotions": { "confident": 0-100, "nervous": 0-100, ... }
            //     },
            //     "bodyPosture": {
            //         "isUpright": boolean,
            //         "isCentered": boolean,
            //         "notes": "string"
            //     },
            //     "professionalAppearance": {
            //         "score": 0-100,
            //         "notes": "string"
            //     }
            // }
            // Only return the JSON, no other text.`;

            // const result = await model.generateContent([
            //     prompt,
            //     { inlineData: { mimeType: 'image/jpeg', data: frameBuffer.toString('base64') } }
            // ]);

            // const response = result.response.text();
            // return JSON.parse(response);

            logger.info('Frame analysis requires Gemini Vision API implementation');
            return null;
        } catch (error: any) {
            logger.error('Frame analysis error:', error.message);
            return null;
        }
    }

    /**
     * Aggregate results from multiple frame analyses
     */
    private aggregateFrameResults(results: FrameAnalysisResult[]): VideoAnalysisResult['visualAnalysis'] {
        if (results.length === 0) {
            return undefined;
        }

        // Calculate averages and aggregations
        const eyeContactCount = results.filter(r => r.eyeContact.isLookingAtCamera).length;
        const eyeContactPercentage = Math.round((eyeContactCount / results.length) * 100);

        // Count dominant expressions
        const expressionCounts: Record<string, number> = {};
        results.forEach(r => {
            const exp = r.facialExpression.dominant;
            expressionCounts[exp] = (expressionCounts[exp] || 0) + 1;
        });
        const dominantExpression = Object.entries(expressionCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        // Average posture checks
        const uprightCount = results.filter(r => r.bodyPosture.isUpright).length;
        const centeredCount = results.filter(r => r.bodyPosture.isCentered).length;
        const postureScore = Math.round(((uprightCount + centeredCount) / (results.length * 2)) * 100);

        // Average professional appearance
        const avgAppearanceScore = Math.round(
            results.reduce((sum, r) => sum + r.professionalAppearance.score, 0) / results.length
        );

        // Calculate overall visual score
        const overallScore = Math.round(
            (eyeContactPercentage * 0.3) +
            (postureScore * 0.3) +
            (avgAppearanceScore * 0.4)
        );

        // Generate suggestions
        const suggestions: string[] = [];

        if (eyeContactPercentage < 70) {
            suggestions.push('Try to maintain more consistent eye contact with the camera. This helps build connection with interviewers.');
        }

        if (postureScore < 70) {
            suggestions.push('Focus on sitting upright and staying centered in the frame. Good posture projects confidence.');
        }

        if (expressionCounts['nervous'] && expressionCounts['nervous'] > results.length * 0.3) {
            suggestions.push('You appeared nervous at times. Practice deep breathing before interviews to help stay calm.');
        }

        if (suggestions.length === 0) {
            suggestions.push('Great job! Your visual presentation was professional and confident.');
        }

        return {
            eyeContact: {
                score: eyeContactPercentage,
                feedback: eyeContactPercentage >= 70
                    ? 'Good eye contact - you maintained focus on the camera well.'
                    : 'Try to look at the camera more consistently to build rapport.',
                percentageLookingAtCamera: eyeContactPercentage,
            },
            facialExpressions: {
                dominantExpression,
                confidence: Math.round(results.reduce((sum, r) => sum + r.facialExpression.confidence, 0) / results.length),
                emotionBreakdown: expressionCounts,
            },
            bodyPosture: {
                score: postureScore,
                feedback: postureScore >= 70
                    ? 'Your posture was good - upright and well-centered.'
                    : 'Work on sitting up straighter and staying centered in the frame.',
                isUpright: uprightCount > results.length / 2,
                isCentered: centeredCount > results.length / 2,
            },
            professionalAppearance: {
                score: avgAppearanceScore,
                feedback: avgAppearanceScore >= 70
                    ? 'Your appearance was professional and appropriate.'
                    : 'Consider your background and lighting for a more professional look.',
            },
            overallVisualScore: overallScore,
            suggestions,
        };
    }

    /**
     * Check if video analysis is available
     */
    isAvailable(): boolean {
        return this.isEnabled;
    }

    /**
     * Get status message for frontend
     */
    getStatusMessage(): string {
        if (this.isEnabled) {
            return 'Video analysis is available with Gemini Vision';
        }
        return 'Video analysis requires GEMINI_API_KEY - will provide feedback on eye contact, expressions, and body language';
    }
}

export const videoAnalysisService = new VideoAnalysisService();
