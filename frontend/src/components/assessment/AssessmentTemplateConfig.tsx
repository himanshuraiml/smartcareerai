'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { authFetch } from '@/lib/auth-fetch';

export const AssessmentTemplateConfig = ({ jobId }: { jobId: string }) => {
    const { register, handleSubmit } = useForm();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [easy, setEasy] = useState(5);
    const [medium, setMedium] = useState(10);
    const [hard, setHard] = useState(5);

    const onSubmit = async (data: any) => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const res = await authFetch(`/assessments/templates/${jobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    durationMinutes: Number(data.duration),
                    totalQuestions: Number(data.questionCount),
                    difficultyDistribution: { EASY: easy, MEDIUM: medium, HARD: hard },
                    requiredSkills: [],
                }),
            });
            if (!res.ok) {
                const { message } = await res.json();
                throw new Error(message || 'Failed to save template');
            }
            setSaved(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configure Assessment for this Job</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Test Duration (minutes)</Label>
                        <Input id="duration" type="number" {...register('duration')} defaultValue={30} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="questionCount">Total Number of Questions</Label>
                        <Input id="questionCount" type="number" {...register('questionCount')} defaultValue={20} />
                    </div>

                    <div className="space-y-4">
                        <Label>Difficulty Distribution (questions)</Label>
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Easy: {easy}</Label>
                            <Slider value={[easy]} onValueChange={([v]) => setEasy(v)} max={30} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Medium: {medium}</Label>
                            <Slider value={[medium]} onValueChange={([v]) => setMedium(v)} max={30} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Hard: {hard}</Label>
                            <Slider value={[hard]} onValueChange={([v]) => setHard(v)} max={30} step={1} />
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {saved && <p className="text-sm text-green-600">Assessment template saved. Candidates who applied will see it immediately.</p>}

                    <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Configuration'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
