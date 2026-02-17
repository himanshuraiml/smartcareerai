'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { authFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, XCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';

interface TestQuestion {
    id: string;
    questionText: string;
    options: string[];
    points: number;
}

interface SkillTest {
    id: string;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    durationMinutes: number;
    passingScore: number;
    questionsCount: number;
    questions: TestQuestion[];
}

interface TestResult {
    score: number;
    passed: boolean;
    correctCount: number;
    totalCount: number;
}

export default function TestPage({ params }: { params: Promise<{ testId: string }> }) {
    const { testId } = React.use(params);
    const router = useRouter();
    const { user } = useAuthStore();
    const [test, setTest] = useState<SkillTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [insufficientCredits, setInsufficientCredits] = useState(false);

    useEffect(() => {
        if (user) {
            startTestSession();
        }
    }, [user, testId]);

    useEffect(() => {
        if (test && !result && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [test, result, timeLeft]);

    const startTestSession = async () => {
        try {
            const res = await authFetch(`/validation/tests/${testId}/start`, {
                method: 'POST',
                headers: {
                    'x-user-id': user?.id || '', // validation service expects x-user-id or auth token handling needs ensuring
                }
            });
            const data = await res.json();
            if (data.success) {
                // Combine test metadata with questions for the frontend state
                const fullTest = {
                    ...data.data.test,
                    questions: data.data.questions
                };
                setTest(fullTest);
                setTimeLeft(data.data.test.durationMinutes * 60);
            } else if (res.status === 402) {
                // Insufficient credits
                setInsufficientCredits(true);
            } else {
                setError(data.error || 'Failed to start test');
            }
        } catch (err) {
            setError('An error occurred while starting the test');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (value: string) => {
        if (test) {
            const currentQuestion = test.questions[currentQuestionIndex];
            setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
        }
    };

    const submitTest = async () => {
        if (!test || submitting) return;
        setSubmitting(true);

        try {
            const res = await authFetch(`/validation/tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user?.id || ''
                },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.error || 'Failed to submit test');
            }
        } catch (err) {
            setError('An error occurred while submitting the test');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

    if (insufficientCredits) {
        return (
            <div className="container mx-auto p-6 max-w-md">
                <Card>
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <CardTitle className="text-xl">No Skill Test Credits</CardTitle>
                        <CardDescription className="text-base mt-2">
                            You've used all your Skill Test credits. Purchase more credits or upgrade your plan to continue taking tests.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Link href="/dashboard/billing">
                            <Button className="w-full flex items-center justify-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Get Credits
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => router.push('/dashboard/tests')} className="w-full">
                            Back to Tests
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
    if (!test) return <div className="text-center mt-10">Test not found</div>;

    if (result) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Test Results</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        {result.passed ? (
                            <CheckCircle className="w-24 h-24 text-green-500" />
                        ) : (
                            <XCircle className="w-24 h-24 text-red-500" />
                        )}
                        <div className="text-center">
                            <h3 className={`text-xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {result.passed ? 'Congratulations! You Passed!' : 'Test Failed'}
                            </h3>
                            <p className="text-gray-600 mt-2">
                                You scored {result.score}% ({result.correctCount}/{result.totalCount} correct)
                            </p>
                        </div>
                        <Button onClick={() => router.push('/dashboard/skills')} className="w-full">
                            Back to Skills
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQuestion = test.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{test.title}</h1>
                    <p className="text-gray-500">{test.difficulty} • {test.questions.length} Questions</p>
                </div>
                <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 60 ? 'text-red-500' : 'text-gray-700'}`}>
                    <Clock className="w-5 h-5" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="mb-4 bg-blue-50 text-blue-800 p-4 rounded-md flex items-start gap-2 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Do not refresh the page or switch tabs. The timer will continue running.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-white">Question {currentQuestionIndex + 1} of {test.questions.length}</CardTitle>
                    <CardDescription className="text-base text-gray-200 font-medium mt-2">
                        {currentQuestion.questionText}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => (
                            <div key={idx} className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/30 ${answers[currentQuestion.id] === option ? 'border-primary bg-primary/5' : 'border-white/10'}`} onClick={() => handleAnswerChange(option)}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${answers[currentQuestion.id] === option ? 'border-primary' : 'border-gray-400'}`}>
                                    {answers[currentQuestion.id] === option && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                <span>{option}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>
                    {isLastQuestion ? (
                        <Button onClick={submitTest} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Test'}
                        </Button>
                    ) : (
                        <Button onClick={() => setCurrentQuestionIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}>
                            Next
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}


