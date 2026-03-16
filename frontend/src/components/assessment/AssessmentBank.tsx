'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface Question {
    id: string;
    text: string;
    category: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    type: 'MCQ' | 'OPEN_ENDED' | 'TRUE_FALSE';
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    isActive: boolean;
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
const CATEGORIES = ['Analytical', 'Logical Reasoning', 'Numerical Reasoning', 'Verbal Reasoning', 'Behavioral', 'Psychometric'] as const;

const diffVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    EASY: 'secondary',
    MEDIUM: 'default',
    HARD: 'destructive',
};

const emptyForm = {
    text: '',
    category: 'Analytical',
    difficulty: 'MEDIUM' as const,
    type: 'MCQ' as const,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
};

export const AssessmentBank = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDiff, setFilterDiff] = useState('');
    const [filterCat, setFilterCat] = useState('Analytical');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchQuestions = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterDiff) params.set('difficulty', filterDiff);
        if (filterCat) params.set('category', filterCat);
        if (search) params.set('search', search);

        authFetch(`/assessments/questions?${params}`)
            .then(r => r.json())
            .then(({ data }) => setQuestions(data ?? []))
            .catch(() => setQuestions([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchQuestions(); }, [filterDiff, filterCat, search]);

    const handleSave = async () => {
        if (!form.text.trim()) return;
        setSaving(true);
        setSaveError(null);
        try {
            const body: any = {
                text: form.text,
                category: form.category,
                difficulty: form.difficulty,
                type: form.type,
            };
            if (form.type === 'MCQ') {
                body.options = form.options.filter(o => o.trim());
                body.correctAnswer = form.correctAnswer;
            }
            if (form.explanation) body.explanation = form.explanation;

            const res = await authFetch('/assessments/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to save question');
            setForm(emptyForm);
            setShowForm(false);
            fetchQuestions();
        } catch (e: any) {
            setSaveError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        await authFetch(`/assessments/questions/${id}`, { method: 'DELETE' });
        setDeletingId(null);
        fetchQuestions();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Assessment Question Bank</h2>
                <Button onClick={() => setShowForm(v => !v)}>
                    {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showForm ? 'Cancel' : 'Add Question'}
                </Button>
            </div>

            {/* Add Question Form */}
            {showForm && (
                <Card className="border-primary/40">
                    <CardHeader><CardTitle className="text-base">New Question</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Question Text</Label>
                            <Textarea
                                rows={3}
                                value={form.text}
                                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                                placeholder="Enter the question..."
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label>Category</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                >
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Difficulty</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                    value={form.difficulty}
                                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))}
                                >
                                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Type</Label>
                                <select
                                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                                    value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="TRUE_FALSE">True / False</option>
                                    <option value="OPEN_ENDED">Open Ended</option>
                                </select>
                            </div>
                        </div>

                        {form.type === 'MCQ' && (
                            <div className="space-y-2">
                                <Label>Answer Options</Label>
                                {form.options.map((opt, i) => (
                                    <Input
                                        key={i}
                                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        value={opt}
                                        onChange={e => setForm(f => {
                                            const options = [...f.options];
                                            options[i] = e.target.value;
                                            return { ...f, options };
                                        })}
                                    />
                                ))}
                                <div className="space-y-1">
                                    <Label>Correct Answer (must match one option exactly)</Label>
                                    <Input
                                        value={form.correctAnswer}
                                        onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
                                        placeholder="Paste the correct option text here"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label>Explanation (optional)</Label>
                            <Textarea
                                rows={2}
                                value={form.explanation}
                                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                                placeholder="Explain why this is the correct answer..."
                            />
                        </div>

                        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                            {saving ? 'Saving…' : 'Save Question'}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search questions..."
                        className="pl-10"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={filterCat}
                    onChange={e => setFilterCat(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={filterDiff}
                    onChange={e => setFilterDiff(e.target.value)}
                >
                    <option value="">All Difficulties</option>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
            </div>

            {!loading && (
                <p className="text-sm text-muted-foreground">{questions.length} question{questions.length !== 1 ? 's' : ''} found</p>
            )}

            {/* Question List */}
            <div className="grid gap-3">
                {loading ? (
                    <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
                ) : questions.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground space-y-2">
                            <p>No questions found.</p>
                            <p className="text-xs">
                                Seed the analytical question bank:{' '}
                                <code className="bg-muted px-1.5 py-0.5 rounded">npm run seed:analytical -w @placenxt/database</code>
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    questions.map((q) => (
                        <Card key={q.id}>
                            <CardContent className="p-4 flex justify-between items-start gap-4">
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline">{q.category}</Badge>
                                        <Badge variant={diffVariant[q.difficulty]}>{q.difficulty}</Badge>
                                        <Badge variant="outline" className="text-xs">{q.type}</Badge>
                                    </div>
                                    <p className="font-medium text-sm">{q.text}</p>
                                    {Array.isArray(q.options) && q.options.length > 0 && (
                                        <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                            {(q.options as string[]).map((opt, i) => (
                                                <li
                                                    key={i}
                                                    className={opt === q.correctAnswer ? 'text-green-600 font-semibold' : ''}
                                                >
                                                    {String.fromCharCode(65 + i)}. {opt}
                                                    {opt === q.correctAnswer && ' ✓'}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {q.explanation && (
                                        <p className="text-xs text-muted-foreground italic mt-1">💡 {q.explanation}</p>
                                    )}
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive w-8 h-8 shrink-0"
                                    onClick={() => handleDelete(q.id)}
                                    disabled={deletingId === q.id}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
