'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, Eye, Target, Loader2, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface Resume {
    id: string;
    fileName: string;
    fileUrl: string;
    status: 'PENDING' | 'PARSING' | 'PARSED' | 'FAILED';
    parsedText?: string;
    createdAt: string;
}

interface AtsScore {
    id: string;
    overallScore: number;
    keywordMatchPercent: number;
    formattingScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
}



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function ResumesPage() {
    const { accessToken, user } = useAuthStore();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [analyzing, setAnalyzing] = useState<string | null>(null);
    const [atsResult, setAtsResult] = useState<AtsScore | null>(null);
    const [showAtsModal, setShowAtsModal] = useState(false);

    // Use user's registered target role
    const targetRole = user?.targetJobRole?.title || 'Software Developer';
    const [pendingResumeId, setPendingResumeId] = useState<string | null>(null);

    // Fetch resumes on mount
    const fetchResumes = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/resumes`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setResumes(data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch resumes:', err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchResumes();
        }
    }, [accessToken, fetchResumes]);

    // Poll for status updates
    useEffect(() => {
        const pendingResumes = resumes.filter(r => r.status === 'PENDING' || r.status === 'PARSING');

        if (pendingResumes.length > 0) {
            const interval = setInterval(fetchResumes, 3000);
            return () => clearInterval(interval);
        }
    }, [resumes, fetchResumes]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('resume', file);

            const response = await fetch(`${API_URL}/resumes/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Upload failed');
            }

            setResumes((prev) => [data.data, ...prev]);
            setTimeout(fetchResumes, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }, [accessToken, fetchResumes]);

    const handleDelete = async (resumeId: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;

        try {
            const response = await fetch(`${API_URL}/resumes/${resumeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                setResumes((prev) => prev.filter(r => r.id !== resumeId));
            } else {
                const data = await response.json();
                setError(data.error?.message || 'Delete failed');
            }
        } catch (err) {
            setError('Failed to delete resume');
        }
    };

    const handleView = async (resume: Resume) => {
        try {
            const response = await fetch(`${API_URL}/resumes/${resume.id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedResume(data.data);
                setShowPreview(true);
            }
        } catch (err) {
            setError('Failed to load resume details');
        }
    };



    const handleAnalyze = async (resumeId: string) => {
        setAnalyzing(resumeId);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/scores/analyze`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resumeId: resumeId,
                    jobRole: targetRole,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setAtsResult(data.data);
                setShowAtsModal(true);

                // Also trigger skill extraction
                try {
                    await fetch(`${API_URL}/skills/analyze-resume`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ resumeId: resumeId }),
                    });
                } catch (e) {
                    console.log('Skill extraction done in background');
                }
            } else {
                setError(data.error?.message || 'Analysis failed');
            }
        } catch (err) {
            setError('Failed to analyze resume');
        } finally {
            setAnalyzing(null);
            setPendingResumeId(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
    });

    const getStatusBadge = (status: Resume['status']) => {
        const badges = {
            PENDING: { color: 'bg-yellow-500/10 text-yellow-400', icon: Loader2, label: 'Pending', spin: true },
            PARSING: { color: 'bg-blue-500/10 text-blue-400', icon: Loader2, label: 'Parsing', spin: true },
            PARSED: { color: 'bg-green-500/10 text-green-400', icon: Check, label: 'Ready', spin: false },
            FAILED: { color: 'bg-red-500/10 text-red-400', icon: AlertCircle, label: 'Failed', spin: false },
        };
        const badge = badges[status];
        return (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <badge.icon className={`w-3 h-3 ${badge.spin ? 'animate-spin' : ''}`} />
                {badge.label}
            </div>
        );
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Resumes</h1>
                    <p className="text-gray-400 mt-2">Upload and manage your resumes for AI-powered analysis</p>
                </div>
                <button
                    onClick={fetchResumes}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Upload Zone */}
            <div
                {...getRootProps()}
                className={`p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="text-center">
                    {uploading ? (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                            </div>
                            <p className="text-white font-medium">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-white font-medium mb-2">
                                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                            </p>
                            <p className="text-gray-400 text-sm">or click to browse (PDF, DOC, DOCX - max 10MB)</p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Resumes List */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Your Resumes</h2>

                {loading ? (
                    <div className="p-12 rounded-2xl glass text-center">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading resumes...</p>
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="p-12 rounded-2xl glass text-center">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No resumes yet</h3>
                        <p className="text-gray-400">Upload your first resume to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resumes.map((resume) => (
                            <div key={resume.id} className="p-4 rounded-xl glass flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{resume.fileName}</p>
                                    <p className="text-gray-400 text-sm">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(resume.status)}
                                    {resume.status === 'PARSED' && (
                                        <button
                                            onClick={() => handleAnalyze(resume.id)}
                                            disabled={analyzing === resume.id}
                                            className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors disabled:opacity-50"
                                            title={`Analyze for ${targetRole}`}
                                        >
                                            {analyzing === resume.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Target className="w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleView(resume)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && selectedResume && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
                    <div className="resume-modal w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="resume-modal-header flex items-center justify-between">
                            <h3 className="resume-modal-title text-lg">{selectedResume.fileName}</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="close-btn p-1 rounded hover:bg-black/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="resume-modal-body overflow-y-auto max-h-[60vh]">
                            <pre className="resume-modal-text text-sm whitespace-pre-wrap font-mono">
                                {selectedResume.parsedText || 'No parsed content available'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}



            {/* ATS Score Modal */}
            {showAtsModal && atsResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop">
                    <div className="resume-modal w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="resume-modal-header flex items-center justify-between">
                            <div>
                                <h3 className="resume-modal-title text-lg">ATS Analysis Results</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Target Role: <span className="text-purple-600 font-medium">{targetRole}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowAtsModal(false)} className="close-btn p-1 rounded hover:bg-black/5">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="resume-modal-body overflow-y-auto max-h-[60vh] space-y-6">
                            {/* Score Circle */}
                            <div className="text-center">
                                <div className={`text-6xl font-bold ${getScoreColor(atsResult.overallScore)}`}>
                                    {atsResult.overallScore}
                                </div>
                                <p className="text-muted mt-2">Overall ATS Score</p>
                            </div>

                            {/* Score Breakdown */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--modal-bg-secondary)' }}>
                                    <p className="text-muted text-sm">Keyword Match</p>
                                    <p className={`text-2xl font-bold ${getScoreColor(atsResult.keywordMatchPercent)}`}>
                                        {atsResult.keywordMatchPercent}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--modal-bg-secondary)' }}>
                                    <p className="text-muted text-sm">Formatting</p>
                                    <p className={`text-2xl font-bold ${getScoreColor(atsResult.formattingScore)}`}>
                                        {atsResult.formattingScore}
                                    </p>
                                </div>
                            </div>

                            {/* Keywords */}
                            {atsResult.matchedKeywords?.length > 0 && (
                                <div>
                                    <h4 className="resume-modal-title font-medium mb-2">✅ Matched Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {atsResult.matchedKeywords.map((kw, i) => (
                                            <span key={i} className="tag-success px-2 py-1 rounded text-sm">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {atsResult.missingKeywords?.length > 0 && (
                                <div>
                                    <h4 className="resume-modal-title font-medium mb-2">❌ Missing Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {atsResult.missingKeywords.map((kw, i) => (
                                            <span key={i} className="tag-danger px-2 py-1 rounded text-sm">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggestions */}
                            {atsResult.suggestions?.length > 0 && (
                                <div>
                                    <h4 className="resume-modal-title font-medium mb-2">💡 Suggestions</h4>
                                    <ul className="space-y-2">
                                        {atsResult.suggestions.map((s, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <span style={{ color: 'var(--modal-accent)' }}>•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
