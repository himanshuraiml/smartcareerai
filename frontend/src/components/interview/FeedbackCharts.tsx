'use client';

import React from 'react';

// Types for the feedback data
interface QuestionMetrics {
    pace: number;
    tone: number;
    fluency: number;
    pauses: number;
    fillerWords: number;
}

interface QuestionFeedback {
    id: string;
    questionText: string;
    skillsAssessed: string[];
    userAnswer: string | null;
    idealAnswer?: string;
    score: number | null;
    feedback: string | null;
    metrics?: QuestionMetrics;
    thinkingDuration?: number;
    speakingDuration?: number;
    improvementTips?: string[];
}

interface OverallMetrics {
    overallScore: number;
    recruiterPerspective: string;
    knowledgeScore: number;
    areasOfImprovement: string[];
    verbalFluency: {
        pace: number;
        tone: number;
        fluency: number;
        pauses: number;
        words: number;
    };
    confidenceScore: number;
}

// Gauge Chart Component (semi-circle)
export function GaugeChart({ value, label, color = '#14b8a6' }: { value: number; label: string; color?: string }) {
    const percentage = Math.min(Math.max(value, 0), 100);
    const rotation = (percentage / 100) * 180;

    return (
        <div className="relative w-full aspect-[2/1]">
            <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Background arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#1a2530"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* Foreground arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
                />
                {/* Needle */}
                <line
                    x1="100"
                    y1="100"
                    x2={100 + 60 * Math.cos((180 - rotation) * Math.PI / 180)}
                    y2={100 - 60 * Math.sin((180 - rotation) * Math.PI / 180)}
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="8" fill={color} />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="text-3xl font-bold text-white">{percentage}%</p>
                <p className="text-gray-400 text-sm">{label}</p>
            </div>
        </div>
    );
}

// Radar Chart Component
export function RadarChart({ data, labels }: { data: number[]; labels: string[] }) {
    const center = 100;
    const radius = 70;
    const sides = labels.length;

    const getPoint = (value: number, index: number) => {
        const angle = (index * 2 * Math.PI / sides) - Math.PI / 2;
        const r = (value / 100) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const gridLevels = [20, 40, 60, 80, 100];

    return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Grid levels */}
            {gridLevels.map((level) => (
                <polygon
                    key={level}
                    points={labels.map((_, i) => {
                        const pt = getPoint(level, i);
                        return `${pt.x},${pt.y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#1a2530"
                    strokeWidth="1"
                />
            ))}

            {/* Axis lines */}
            {labels.map((_, i) => {
                const pt = getPoint(100, i);
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={pt.x}
                        y2={pt.y}
                        stroke="#1a2530"
                        strokeWidth="1"
                    />
                );
            })}

            {/* Data polygon */}
            <polygon
                points={data.map((value, i) => {
                    const pt = getPoint(value, i);
                    return `${pt.x},${pt.y}`;
                }).join(' ')}
                fill="rgba(20, 184, 166, 0.2)"
                stroke="#14b8a6"
                strokeWidth="2"
            />

            {/* Data points */}
            {data.map((value, i) => {
                const pt = getPoint(value, i);
                return (
                    <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        fill="#14b8a6"
                    />
                );
            })}

            {/* Labels */}
            {labels.map((label, i) => {
                const pt = getPoint(115, i);
                return (
                    <text
                        key={i}
                        x={pt.x}
                        y={pt.y}
                        fill="#9ca3af"
                        fontSize="10"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {label}
                    </text>
                );
            })}
        </svg>
    );
}

// Horizontal Bar Chart Component
export function BarChart({ data, labels, color = '#14b8a6' }: { data: number[]; labels: string[]; color?: string }) {
    const maxValue = Math.max(...data, 10);

    return (
        <div className="space-y-2">
            {data.map((value, i) => (
                <div key={i} className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs w-8">{labels[i]}</span>
                    <div className="flex-1 h-6 bg-gray-800/50 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(value / maxValue) * 100}%`,
                                backgroundColor: color
                            }}
                        />
                    </div>
                    <span className="text-white text-sm font-medium w-8 text-right">{value}</span>
                </div>
            ))}
        </div>
    );
}

// Metric Card Component
export function MetricCard({ label, value, subLabel }: { label: string; value: number; subLabel?: string }) {
    return (
        <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subLabel && <p className="text-gray-500 text-xs mt-1">{subLabel}</p>}
        </div>
    );
}

// Skill Tag Component
export function SkillTag({ skill, checked = false }: { skill: string; checked?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${checked
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-gray-800 text-gray-400 border border-white/10'
            }`}>
            {checked && <span>✓</span>}
            {skill}
        </span>
    );
}

// Main Performance Breakdown Component
export function PerformanceBreakdown({
    score,
    recruiterPerspective,
    knowledgeScore,
    areasOfImprovement
}: {
    score: number;
    recruiterPerspective: string;
    knowledgeScore: number;
    areasOfImprovement: string[];
}) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-400';
        if (s >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreLabel = (s: number) => {
        if (s >= 80) return 'Excellent';
        if (s >= 60) return 'Good';
        if (s >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    return (
        <div className="p-6 rounded-2xl glass">
            <h2 className="text-xl font-bold text-white mb-6">Performance Breakdown</h2>
            <p className="text-gray-400 mb-6">An in-depth look at your mock interview performance metrics.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Card */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/20">
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-8 border-teal-500/30 flex items-center justify-center">
                                <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}/100</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-teal-400 font-medium">{getScoreLabel(score)}</p>
                    <p className="text-center text-gray-500 text-sm mt-1">Foundation builder ⓘ</p>
                </div>

                {/* Recruiter Perspective & Knowledge */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5">
                        <h3 className="text-white font-medium mb-2">Recruiter&apos;s Perspective</h3>
                        <p className="text-gray-400 text-sm">{recruiterPerspective}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5">
                            <h3 className="text-white font-medium mb-2">Knowledge & Domain Understanding</h3>
                            <p className="text-gray-400 text-sm">
                                {knowledgeScore > 0
                                    ? `Score: ${knowledgeScore}%`
                                    : 'No evidence of technical understanding or domain knowledge could be evaluated.'}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5">
                            <h3 className="text-white font-medium mb-2">Areas of Improvement</h3>
                            <ul className="text-gray-400 text-sm space-y-1">
                                {areasOfImprovement.map((area, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-teal-400">•</span>
                                        {area}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Question-wise Feedback Component
export function QuestionFeedbackPanel({
    questions,
    selectedIndex,
    onSelectQuestion
}: {
    questions: QuestionFeedback[];
    selectedIndex: number;
    onSelectQuestion: (index: number) => void;
}) {
    const selectedQuestion = questions[selectedIndex];

    return (
        <div className="p-6 rounded-2xl glass">
            <h2 className="text-xl font-bold text-white mb-2">Question wise feedback</h2>
            <p className="text-gray-400 mb-6">Detailed AI analysis of your responses with actionable insights for improvement</p>

            {/* Question Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {questions.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => onSelectQuestion(i)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${i === selectedIndex
                                ? 'bg-teal-500 text-white'
                                : questions[i].userAnswer
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-800/50 text-gray-500'
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Selected Question Content */}
            {selectedQuestion && (
                <div className="space-y-6">
                    {/* Question */}
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5">
                        <p className="text-white font-medium">{selectedQuestion.questionText}</p>
                    </div>

                    {/* Skills Assessed */}
                    {selectedQuestion.skillsAssessed && selectedQuestion.skillsAssessed.length > 0 && (
                        <div>
                            <p className="text-gray-400 text-sm mb-2">Skill Assessed</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedQuestion.skillsAssessed.map((skill, i) => (
                                    <SkillTag key={i} skill={skill} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Your Answer */}
                    <div>
                        <p className="text-gray-400 text-sm mb-2">Your Answer</p>
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-white/5">
                            <p className="text-gray-300">
                                {selectedQuestion.userAnswer || 'No answer recorded'}
                            </p>
                        </div>
                    </div>

                    {/* Ideal Answer */}
                    {selectedQuestion.idealAnswer && (
                        <div>
                            <p className="text-gray-400 text-sm mb-2">Ideal Answer</p>
                            <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                                <p className="text-gray-300">{selectedQuestion.idealAnswer}</p>
                                {selectedQuestion.skillsAssessed && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {selectedQuestion.skillsAssessed.map((skill, i) => (
                                            <SkillTag key={i} skill={skill} checked />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Verbal Fluency Metrics */}
                    {selectedQuestion.metrics && (
                        <div>
                            <p className="text-gray-400 text-sm mb-3">Verbal Fluency</p>
                            <div className="grid grid-cols-5 gap-3">
                                <MetricCard label="Pace" value={selectedQuestion.metrics.pace} />
                                <MetricCard label="Tone" value={selectedQuestion.metrics.tone} />
                                <MetricCard label="Fluency" value={selectedQuestion.metrics.fluency} />
                                <MetricCard label="Pauses" value={selectedQuestion.metrics.pauses} />
                                <MetricCard label="Filler Words" value={selectedQuestion.metrics.fillerWords} />
                            </div>
                        </div>
                    )}

                    {/* Improvement Tips */}
                    {selectedQuestion.improvementTips && selectedQuestion.improvementTips.length > 0 && (
                        <div>
                            <p className="text-gray-400 text-sm mb-2">How can You Improve?</p>
                            <ul className="text-gray-400 text-sm space-y-1">
                                {selectedQuestion.improvementTips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="text-teal-400">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default {
    GaugeChart,
    RadarChart,
    BarChart,
    MetricCard,
    SkillTag,
    PerformanceBreakdown,
    QuestionFeedbackPanel
};


