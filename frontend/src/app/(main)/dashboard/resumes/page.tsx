'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { Upload, FileText, Trash2, Eye, Target, Loader2, Check, AlertCircle, RefreshCw, X, CreditCard, AlertTriangle, BarChart2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import ResumeAnalysisReport from '@/components/scoring/ResumeAnalysisReport';
import ResumeBuilder from '@/components/resume-builder/ResumeBuilder';

interface AtsScore {
    id: string;
    overallScore: number;
    keywordMatchPercent: number;
    formattingScore: number;
    experienceScore?: number;
    educationScore?: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    formattingIssues?: string[];
    suggestions: string[];
    createdAt?: string;
}

interface Resume {
    id: string;
    fileName: string;
    fileUrl: string;
    status: 'PENDING' | 'PARSING' | 'PARSED' | 'FAILED';
    parsedText?: string;
    createdAt: string;
    latestAnalysis?: AtsScore | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function ResumesPage() {
    const { accessToken, user } = useAuthStore();
    const [view, setView] = useState<'list' | 'builder'>('list');
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [analyzing, setAnalyzing] = useState<string | null>(null);
    const [atsResult, setAtsResult] = useState<AtsScore | null>(null);
    const [showAtsModal, setShowAtsModal] = useState(false);
    const [analyzedResumeId, setAnalyzedResumeId] = useState<string | null>(null);

    // Use user's registered target role
    const targetRole = user?.targetJobRole?.title || 'Software Developer';
    const [showCreditsModal, setShowCreditsModal] = useState(false);

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

    const handleViewReport = (resume: Resume) => {
        if (resume.latestAnalysis) {
            setAtsResult(resume.latestAnalysis);
            setAnalyzedResumeId(resume.id);
            setShowAtsModal(true);
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
                setAnalyzedResumeId(resumeId);
                setShowAtsModal(true);
                // Refresh list to update latestAnalysis
                fetchResumes();

                // Also trigger skill extraction
                try {
                    await fetch(`${API_URL}/skills/analyze`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ resumeId: resumeId }),
                    });
                } catch (e) {
                    // Skill extraction done in background (silently handled)
                }
            } else if (response.status === 402) {
                // Insufficient credits
                setShowCreditsModal(true);
            } else {
                setError(data.error?.message || data.error || 'Analysis failed');
            }
        } catch (err) {
            setError('Failed to analyze resume');
        } finally {
            setAnalyzing(null);
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Resumes</h1>
                <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
                    <button
                        onClick={() => setView('list')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Resumes
                    </button>
                    <button
                        onClick={() => setView('builder')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'builder' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Resume Builder
                    </button>
                </div>
            </div>

            {view === 'builder' ? (
                <ResumeBuilder />
            ) : (
                <div className="space-y-8">
                    {/* Upload Zone */}
                    <div
                        {...getRootProps()}
                        className={`p-6 md:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer
                  ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5'}
                  ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="text-center">
                            {uploading ? (
                                <>
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 animate-spin" />
                                    </div>
                                    <p className="text-white font-medium">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Upload className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />
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
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
                                <p className="text-gray-400">Loading resumes...</p>
                            </div>
                        ) : resumes.length === 0 ? (
                            <div className="p-12 rounded-2xl glass text-center">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No resumes yet</h3>
                                <p className="text-gray-400">Upload your first resume or use the Builder to create one</p>
                                <button
                                    onClick={() => setView('builder')}
                                    className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
                                >
                                    Create with Builder
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {resumes.map((resume) => (
                                    <div key={resume.id} className="p-4 rounded-xl glass hover:bg-white/5 transition-colors group">
                                        {/* Mobile Layout: Stacked */}
                                        <div className="flex flex-col gap-4 sm:hidden">
                                            {/* File Info Row */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm leading-tight break-all line-clamp-2">{resume.fileName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-gray-400 text-xs text-nowrap">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                                                        {getStatusBadge(resume.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Row */}
                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                                {resume.status === 'PARSED' ? (
                                                    resume.latestAnalysis ? (
                                                        <button
                                                            onClick={() => handleViewReport(resume)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all group-hover:bg-emerald-500/20"
                                                            title="View Analysis Report"
                                                        >
                                                            <BarChart2 className="w-4 h-4" />
                                                            <span>View Report ({resume.latestAnalysis.overallScore})</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAnalyze(resume.id)}
                                                            disabled={analyzing === resume.id}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                                                            title={`Analyze for ${targetRole}`}
                                                        >
                                                            {analyzing === resume.id ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    <span>Analyzing...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Target className="w-4 h-4" />
                                                                    <span>Check ATS Score</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )
                                                ) : (
                                                    <div className="flex-1" />
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleView(resume)}
                                                        className="w-10 h-10 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                                                        title="View Resume"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(resume.id)}
                                                        className="w-10 h-10 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Layout: Horizontal */}
                                        <div className="hidden sm:flex items-center gap-4">
                                            <div className="w-12 h-12 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{resume.fileName}</p>
                                                <p className="text-gray-400 text-sm">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                                            </div>

                                            {resume.latestAnalysis && (
                                                <div className="flex flex-col items-end mr-4">
                                                    <span className={`text-lg font-bold ${getScoreColor(resume.latestAnalysis.overallScore)}`}>
                                                        {resume.latestAnalysis.overallScore}
                                                    </span>
                                                    <span className="text-xs text-gray-500">ATS Score</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(resume.status)}
                                                {resume.status === 'PARSED' && (
                                                    resume.latestAnalysis ? (
                                                        <button
                                                            onClick={() => handleViewReport(resume)}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all group-hover:bg-emerald-500/20"
                                                            title="View Analysis Report"
                                                        >
                                                            <BarChart2 className="w-4 h-4" />
                                                            <span>View Report</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAnalyze(resume.id)}
                                                            disabled={analyzing === resume.id}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                                                            title={`Analyze for ${targetRole}`}
                                                        >
                                                            {analyzing === resume.id ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    <span>Analyzing...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Target className="w-4 h-4" />
                                                                    <span>Check ATS Score</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )
                                                )}
                                                <div className="w-px h-8 bg-white/10 mx-2" />
                                                <button
                                                    onClick={() => handleView(resume)}
                                                    className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
                                                    title="View Resume Content"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(resume.id)}
                                                    className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
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

                    {/* Insufficient Credits Modal */}
                    {showCreditsModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-backdrop bg-black/80 backdrop-blur-sm">
                            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-xl">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">No Resume Review Credits</h2>
                                    <p className="text-gray-400 mb-6">
                                        You've used all your Resume Review credits. Purchase more credits or upgrade your plan to continue analyzing resumes.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowCreditsModal(false)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition hover:bg-white/5"
                                        >
                                            Cancel
                                        </button>
                                        <Link
                                            href="/dashboard/billing"
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Get Credits
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resume Analysis Report Modal */}
                    {showAtsModal && atsResult && (
                        <ResumeAnalysisReport
                            data={atsResult}
                            fileName={resumes.find(r => r.id === analyzedResumeId)?.fileName || 'Resume'}
                            onClose={() => setShowAtsModal(false)}
                            onReanalyze={analyzedResumeId ? () => handleAnalyze(analyzedResumeId) : undefined}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
