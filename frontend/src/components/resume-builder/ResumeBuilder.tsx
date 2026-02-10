'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Upload, ChevronRight, ChevronLeft, Download, RefreshCw, Wand2, X, Plus, Trash2, Briefcase, GraduationCap, User, FileText, Globe, Loader2, Award, BookOpen, MapPin, Activity, Heart } from 'lucide-react';
import ResumeTemplates from './ResumeTemplates';
import ResumeRenderer from './ResumeRenderer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Types
interface ResumeData {
    personal: {
        fullName: string;
        email: string;
        phone: string;
        linkedin: string;
        portfolio: string;
        summary: string;
    };
    experience: Array<{
        id: string;
        company: string;
        role: string;
        startDate: string;
        endDate: string;
        current: boolean;
        description: string;
    }>;
    education: Array<{
        id: string;
        school: string;
        degree: string;
        field: string;
        startDate: string;
        endDate: string;
        grade: string;
    }>;
    skills: string[];
    internships: Array<{
        id: string;
        company: string;
        role: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    projects: Array<{
        id: string;
        title: string;
        description: string;
        technologies: string[];
        link: string;
    }>;
    certifications: Array<{
        id: string;
        name: string;
        issuer: string;
        date: string;
        link: string;
    }>;
    industrialTraining: Array<{
        id: string;
        organization: string;
        project: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    publications: Array<{
        id: string;
        title: string;
        publisher: string;
        date: string;
        link: string;
    }>;
    awards: Array<{
        id: string;
        title: string;
        date: string;
        issuer: string;
    }>;
    coCurricular: string[];
    industrialVisits: Array<{
        id: string;
        company: string;
        date: string;
        description: string;
    }>;
    hobbies: string[];
}

const initialResumeData: ResumeData = {
    personal: { fullName: '', email: '', phone: '', linkedin: '', portfolio: '', summary: '' },
    experience: [],
    education: [],
    skills: [],
    internships: [],
    projects: [],
    certifications: [],
    industrialTraining: [],
    publications: [],
    awards: [],
    coCurricular: [],
    industrialVisits: [],
    hobbies: [],
};

export default function ResumeBuilder() {
    const { accessToken, user } = useAuthStore();
    const [step, setStep] = useState(0); // 0: Template, 1: Import, 2: Edit, 3: Preview
    const [templateId, setTemplateId] = useState('');
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [importing, setImporting] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [optimizing, setOptimizing] = useState<string | null>(null); // field/section ID
    const [generatingBullets, setGeneratingBullets] = useState<string | null>(null); // experience ID
    const [isInitialized, setIsInitialized] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('resumeData');
            const savedTemplateId = localStorage.getItem('templateId');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setResumeData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error('Failed to parse saved resume data', e);
                }
            }
            if (savedTemplateId) {
                setTemplateId(savedTemplateId);
            }
            setIsInitialized(true);
        }
    }, []);

    // Save to localStorage whenever data changes
    useEffect(() => {
        if (typeof window !== 'undefined' && isInitialized) {
            localStorage.setItem('resumeData', JSON.stringify(resumeData));
            if (templateId) localStorage.setItem('templateId', templateId);
        }
    }, [resumeData, templateId, isInitialized]);

    // AI Helpers
    const optimizeText = async (sectionInfo: string, content: string, fieldKey: string) => {
        if (!content) return;
        setOptimizing(fieldKey);
        try {
            const res = await fetch(`${API_URL}/resumes/builder/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    sectionType: sectionInfo,
                    content,
                    targetRole: user?.targetJobRole?.title || 'Software Engineer',
                }),
            });
            const data = await res.json();
            if (data.success) {
                // Update specific field - complex state update logic
                if (fieldKey === 'summary') {
                    setResumeData(prev => ({ ...prev, personal: { ...prev.personal, summary: data.data.optimizedContent } }));
                } else if (fieldKey.startsWith('exp-')) {
                    const expId = fieldKey.split('-')[1];
                    setResumeData(prev => ({
                        ...prev,
                        experience: prev.experience.map(e => e.id === expId ? { ...e, description: data.data.optimizedContent } : e)
                    }));
                }
            }
        } catch (err) {
            console.error('Optimization failed', err);
        } finally {
            setOptimizing(null);
        }
    };

    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const element = document.getElementById('resume-preview');
            if (!element) throw new Error('Resume element not found');

            // Dynamic import to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const opt = {
                margin: 0,
                filename: `${resumeData.personal.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
                image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'in' as 'in', format: 'letter' as 'letter', orientation: 'portrait' as 'portrait' },
                enableLinks: true,
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Failed to generate PDF. Please try again or use the print option.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            // 1. Upload
            const formData = new FormData();
            formData.append('resume', file);
            const uploadRes = await fetch(`${API_URL}/resumes/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadData.success) throw new Error('Upload failed');

            const resumeId = uploadData.data.id;

            // 2. Parse
            const parseRes = await fetch(`${API_URL}/resumes/${resumeId}/parse`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            const parseData = await parseRes.json();

            if (parseData.success && parseData.data) {
                const parsed = parseData.data;

                setResumeData(prev => ({
                    ...prev,
                    personal: {
                        ...prev.personal,
                        fullName: parsed.personalInfo?.name || parsed.name || '',
                        email: parsed.personalInfo?.email || parsed.email || '',
                        phone: parsed.personalInfo?.phone || parsed.phone || '',
                        linkedin: (parsed.personalInfo?.links && Array.isArray(parsed.personalInfo.links)
                            ? parsed.personalInfo.links.find((l: string) => l.includes('linkedin'))
                            : parsed.linkedin) || '',
                        portfolio: parsed.personalInfo?.portfolio || parsed.portfolio || prev.personal.portfolio || '',
                        summary: parsed.professionalSummary || parsed.summary || prev.personal.summary || '',
                    },
                    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                    experience: Array.isArray(parsed.experience) ? parsed.experience.map((exp: any) => ({
                        id: exp.id || Date.now().toString() + Math.random(),
                        company: exp.company || '',
                        role: exp.role || exp.title || '',
                        startDate: exp.startDate || '',
                        endDate: exp.endDate || '',
                        current: exp.current || false,
                        description: exp.description || ''
                    })) : [],
                    education: Array.isArray(parsed.education) ? parsed.education.map((edu: any) => ({
                        id: edu.id || Date.now().toString() + Math.random(),
                        school: edu.school || edu.institution || '',
                        degree: edu.degree || '',
                        field: edu.field || edu.major || '',
                        startDate: edu.startDate || '',
                        endDate: edu.endDate || '',
                        grade: edu.grade || ''
                    })) : [],
                    internships: Array.isArray(parsed.internships) ? parsed.internships.map((int: any) => ({
                        id: int.id || Date.now().toString() + Math.random(),
                        company: int.company || '',
                        role: int.role || '',
                        startDate: int.startDate || '',
                        endDate: int.endDate || '',
                        description: int.description || ''
                    })) : [], // Fallback logic if AI put internships in experience could overlap, but specialized section is improved
                    projects: Array.isArray(parsed.projects) ? parsed.projects.map((proj: any) => ({
                        id: proj.id || Date.now().toString() + Math.random(),
                        title: proj.title || '',
                        description: proj.description || '',
                        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
                        link: proj.link || ''
                    })) : [],
                    certifications: Array.isArray(parsed.certifications) ? parsed.certifications.map((cert: any) => ({
                        id: cert.id || Date.now().toString() + Math.random(),
                        name: cert.name || '',
                        issuer: cert.issuer || '',
                        date: cert.date || '',
                        link: cert.link || ''
                    })) : [],
                    industrialTraining: Array.isArray(parsed.industrialTraining) ? parsed.industrialTraining.map((tr: any) => ({
                        id: tr.id || Date.now().toString() + Math.random(),
                        organization: tr.organization || '',
                        project: tr.project || '',
                        startDate: tr.startDate || '',
                        endDate: tr.endDate || '',
                        description: tr.description || ''
                    })) : [],
                    publications: Array.isArray(parsed.publications) ? parsed.publications.map((pub: any) => ({
                        id: pub.id || Date.now().toString() + Math.random(),
                        title: pub.title || '',
                        publisher: pub.publisher || '',
                        date: pub.date || '',
                        link: pub.link || ''
                    })) : [],
                    awards: Array.isArray(parsed.awards) ? parsed.awards.map((aw: any) => ({
                        id: aw.id || Date.now().toString() + Math.random(),
                        title: aw.title || '',
                        date: aw.date || '',
                        issuer: aw.issuer || ''
                    })) : [],
                    industrialVisits: Array.isArray(parsed.industrialVisits) ? parsed.industrialVisits.map((iv: any) => ({
                        id: iv.id || Date.now().toString() + Math.random(),
                        company: iv.company || '',
                        date: iv.date || '',
                        description: iv.description || ''
                    })) : [],
                    coCurricular: Array.isArray(parsed.coCurricular) ? parsed.coCurricular : [],
                    hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies : [],
                }));
            }
            setStep(2); // Go to edit
        } catch (err) {
            console.error('Import failed', err);
            alert('Failed to import resume. Please try entering details manually.');
        } finally {
            setImporting(false);
        }
    };

    const addExperience = () => {
        setResumeData(prev => ({
            ...prev,
            experience: [...prev.experience, {
                id: Date.now().toString(),
                company: '',
                role: '',
                startDate: '',
                endDate: '',
                current: false,
                description: ''
            }]
        }));
    };

    const addEducation = () => {
        setResumeData(prev => ({
            ...prev,
            education: [...prev.education, {
                id: Date.now().toString(),
                school: '',
                degree: '',
                field: '',
                startDate: '',
                endDate: '',
                grade: ''
            }]
        }));
    };

    const addInternship = () => {
        setResumeData(prev => ({
            ...prev,
            internships: [...prev.internships, {
                id: Date.now().toString(),
                company: '',
                role: '',
                startDate: '',
                endDate: '',
                description: ''
            }]
        }));
    };

    const addProject = () => {
        setResumeData(prev => ({
            ...prev,
            projects: [...prev.projects, {
                id: Date.now().toString(),
                title: '',
                description: '',
                technologies: [],
                link: ''
            }]
        }));
    };

    const addCertification = () => {
        setResumeData(prev => ({
            ...prev,
            certifications: [...prev.certifications, {
                id: Date.now().toString(),
                name: '',
                issuer: '',
                date: '',
                link: ''
            }]
        }));
    };

    const addTraining = () => {
        setResumeData(prev => ({
            ...prev,
            industrialTraining: [...prev.industrialTraining, {
                id: Date.now().toString(),
                organization: '',
                project: '',
                startDate: '',
                endDate: '',
                description: ''
            }]
        }));
    };

    const addPublication = () => {
        setResumeData(prev => ({
            ...prev,
            publications: [...prev.publications, {
                id: Date.now().toString(),
                title: '',
                publisher: '',
                date: '',
                link: ''
            }]
        }));
    };

    const addAward = () => {
        setResumeData(prev => ({
            ...prev,
            awards: [...prev.awards, {
                id: Date.now().toString(),
                title: '',
                date: '',
                issuer: ''
            }]
        }));
    };

    const addVisit = () => {
        setResumeData(prev => ({
            ...prev,
            industrialVisits: [...prev.industrialVisits, {
                id: Date.now().toString(),
                company: '',
                date: '',
                description: ''
            }]
        }));
    };

    // Render Steps
    // Step 0: Templates
    if (step === 0) {
        return <ResumeTemplates onSelect={(id) => {
            setTemplateId(id);
            localStorage.setItem('templateId', id);
            // If we already have resume data, skip step 1 (Import)
            if (resumeData.personal.fullName || resumeData.experience.length > 0 || resumeData.education.length > 0) {
                setStep(3); // Go straight to preview to see the new template
            } else {
                setStep(1);
            }
        }} />;
    }

    // Step 1: Import or Start
    if (step === 1) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 py-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white">How do you want to start?</h2>
                    <p className="text-gray-400">Import your existing resume or LinkedIn PDF export to save time.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500 hover:bg-white/5 cursor-pointer transition-all text-center space-y-4"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                        />
                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            {importing ? <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /> : <Upload className="w-8 h-8 text-indigo-400" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">Import Resume / LinkedIn</h3>
                            <p className="text-sm text-gray-400 mt-2">Upload your current resume or LinkedIn profile PDF export.</p>
                        </div>
                    </div>

                    <div
                        onClick={() => setStep(2)}
                        className="group p-8 rounded-2xl border-2 border-white/10 hover:border-emerald-500 hover:bg-white/5 cursor-pointer transition-all text-center space-y-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">Start from Scratch</h3>
                            <p className="text-sm text-gray-400 mt-2">Build your resume step-by-step using our smart wizard.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setStep(0)}
                    className="mx-auto block text-gray-500 hover:text-white transition-colors"
                >
                    Back to Templates
                </button>
            </div>
        );
    }

    // Step 2: Edit Form
    if (step === 2) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Edit Your Resume</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStep(3)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium flex items-center gap-2"
                        >
                            Preview & Download <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Personal Info */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <User className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Personal Experience</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            placeholder="Full Name"
                            className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            value={resumeData.personal.fullName}
                            onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, fullName: e.target.value } })}
                        />
                        <input
                            placeholder="Email"
                            className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            value={resumeData.personal.email}
                            onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, email: e.target.value } })}
                        />
                        <input
                            placeholder="Phone"
                            className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            value={resumeData.personal.phone}
                            onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, phone: e.target.value } })}
                        />
                        <input
                            placeholder="LinkedIn URL"
                            className="bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            value={resumeData.personal.linkedin}
                            onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, linkedin: e.target.value } })}
                        />
                    </div>

                    <div className="relative">
                        <h4 className="text-sm text-gray-400 mb-2">Professional Summary</h4>
                        <textarea
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="Brief summary of your professional background..."
                            value={resumeData.personal.summary}
                            onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, summary: e.target.value } })}
                        />
                        <button
                            onClick={() => optimizeText('summary', resumeData.personal.summary, 'summary')}
                            disabled={!resumeData.personal.summary || optimizing === 'summary'}
                            className="absolute bottom-3 right-3 p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                            title="Optimize with AI"
                        >
                            {optimizing === 'summary' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        </button>
                    </div>
                </section>

                {/* Experience */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Briefcase className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Experience</h3>
                        </div>
                        <button onClick={addExperience} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Experience
                        </button>
                    </div>

                    {resumeData.experience.map((exp, index) => (
                        <div key={exp.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== exp.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Role / Job Title"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={exp.role}
                                    onChange={e => setResumeData(prev => ({ ...prev, experience: prev.experience.map(item => item.id === exp.id ? { ...item, role: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Company Name"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={exp.company}
                                    onChange={e => setResumeData(prev => ({ ...prev, experience: prev.experience.map(item => item.id === exp.id ? { ...item, company: e.target.value } : item) }))}
                                />
                            </div>

                            <div className="relative">
                                <textarea
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                                    placeholder="Describe your responsibilities and achievements..."
                                    value={exp.description}
                                    onChange={e => setResumeData(prev => ({ ...prev, experience: prev.experience.map(item => item.id === exp.id ? { ...item, description: e.target.value } : item) }))}
                                />
                                <button
                                    onClick={() => optimizeText('experience', exp.description, `exp-${exp.id}`)}
                                    disabled={!exp.description || optimizing === `exp-${exp.id}`}
                                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                                    title="Auto-enhance Description"
                                >
                                    {optimizing === `exp-${exp.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Education */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <GraduationCap className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Education</h3>
                        </div>
                        <button onClick={addEducation} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Education
                        </button>
                    </div>

                    {resumeData.education.map((edu, index) => (
                        <div key={edu.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== edu.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="School / University"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={edu.school}
                                    onChange={e => setResumeData(prev => ({ ...prev, education: prev.education.map(item => item.id === edu.id ? { ...item, school: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Degree (e.g. BSc)"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={edu.degree}
                                    onChange={e => setResumeData(prev => ({ ...prev, education: prev.education.map(item => item.id === edu.id ? { ...item, degree: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Field of Study"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={edu.field}
                                    onChange={e => setResumeData(prev => ({ ...prev, education: prev.education.map(item => item.id === edu.id ? { ...item, field: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Grade / CGPA"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={edu.grade}
                                    onChange={e => setResumeData(prev => ({ ...prev, education: prev.education.map(item => item.id === edu.id ? { ...item, grade: e.target.value } : item) }))}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        placeholder="Start Year"
                                        className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                        value={edu.startDate}
                                        onChange={e => setResumeData(prev => ({ ...prev, education: prev.education.map(item => item.id === edu.id ? { ...item, startDate: e.target.value } : item) }))}
                                    />
                                    <input
                                        placeholder="End Year"
                                        className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                        value={edu.endDate}
                                        onChange={e => setResumeData(prev => ({ ...prev, education: prev.education.map(item => item.id === edu.id ? { ...item, endDate: e.target.value } : item) }))}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Internships */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Briefcase className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Internships</h3>
                        </div>
                        <button onClick={addInternship} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Internship
                        </button>
                    </div>
                    {resumeData.internships.map((int) => (
                        <div key={int.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, internships: prev.internships.filter(i => i.id !== int.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Role / Title"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={int.role}
                                    onChange={e => setResumeData(prev => ({ ...prev, internships: prev.internships.map(item => item.id === int.id ? { ...item, role: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Company"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={int.company}
                                    onChange={e => setResumeData(prev => ({ ...prev, internships: prev.internships.map(item => item.id === int.id ? { ...item, company: e.target.value } : item) }))}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        placeholder="Start Date"
                                        className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                        value={int.startDate}
                                        onChange={e => setResumeData(prev => ({ ...prev, internships: prev.internships.map(item => item.id === int.id ? { ...item, startDate: e.target.value } : item) }))}
                                    />
                                    <input
                                        placeholder="End Date"
                                        className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                        value={int.endDate}
                                        onChange={e => setResumeData(prev => ({ ...prev, internships: prev.internships.map(item => item.id === int.id ? { ...item, endDate: e.target.value } : item) }))}
                                    />
                                </div>
                            </div>
                            <textarea
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="Description..."
                                value={int.description}
                                onChange={e => setResumeData(prev => ({ ...prev, internships: prev.internships.map(item => item.id === int.id ? { ...item, description: e.target.value } : item) }))}
                            />
                        </div>
                    ))}
                </section>

                {/* Projects */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <FileText className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Projects</h3>
                        </div>
                        <button onClick={addProject} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Project
                        </button>
                    </div>
                    {resumeData.projects.map((proj) => (
                        <div key={proj.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== proj.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Project Title"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={proj.title}
                                    onChange={e => setResumeData(prev => ({ ...prev, projects: prev.projects.map(item => item.id === proj.id ? { ...item, title: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Link (Optional)"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={proj.link}
                                    onChange={e => setResumeData(prev => ({ ...prev, projects: prev.projects.map(item => item.id === proj.id ? { ...item, link: e.target.value } : item) }))}
                                />
                            </div>
                            <input
                                placeholder="Technologies (comma separated)"
                                className="w-full bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                value={proj.technologies.join(', ')}
                                onChange={e => setResumeData(prev => ({ ...prev, projects: prev.projects.map(item => item.id === proj.id ? { ...item, technologies: e.target.value.split(',').map(t => t.trim()) } : item) }))}
                            />
                            <textarea
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="Project Description..."
                                value={proj.description}
                                onChange={e => setResumeData(prev => ({ ...prev, projects: prev.projects.map(item => item.id === proj.id ? { ...item, description: e.target.value } : item) }))}
                            />
                        </div>
                    ))}
                </section>

                {/* Industrial Training */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Briefcase className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Industrial Training</h3>
                        </div>
                        <button onClick={addTraining} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Training
                        </button>
                    </div>
                    {resumeData.industrialTraining.map((tr) => (
                        <div key={tr.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, industrialTraining: prev.industrialTraining.filter(t => t.id !== tr.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Organization"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={tr.organization}
                                    onChange={e => setResumeData(prev => ({ ...prev, industrialTraining: prev.industrialTraining.map(item => item.id === tr.id ? { ...item, organization: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Project/Subject"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={tr.project}
                                    onChange={e => setResumeData(prev => ({ ...prev, industrialTraining: prev.industrialTraining.map(item => item.id === tr.id ? { ...item, project: e.target.value } : item) }))}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        placeholder="Start Date"
                                        className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                        value={tr.startDate}
                                        onChange={e => setResumeData(prev => ({ ...prev, industrialTraining: prev.industrialTraining.map(item => item.id === tr.id ? { ...item, startDate: e.target.value } : item) }))}
                                    />
                                    <input
                                        placeholder="End Date"
                                        className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                        value={tr.endDate}
                                        onChange={e => setResumeData(prev => ({ ...prev, industrialTraining: prev.industrialTraining.map(item => item.id === tr.id ? { ...item, endDate: e.target.value } : item) }))}
                                    />
                                </div>
                            </div>
                            <textarea
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="Details..."
                                value={tr.description}
                                onChange={e => setResumeData(prev => ({ ...prev, industrialTraining: prev.industrialTraining.map(item => item.id === tr.id ? { ...item, description: e.target.value } : item) }))}
                            />
                        </div>
                    ))}
                </section>

                {/* Certifications */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Award className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Certifications</h3>
                        </div>
                        <button onClick={addCertification} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Certification
                        </button>
                    </div>
                    {resumeData.certifications.map((cert) => (
                        <div key={cert.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== cert.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Name / Course"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={cert.name}
                                    onChange={e => setResumeData(prev => ({ ...prev, certifications: prev.certifications.map(item => item.id === cert.id ? { ...item, name: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Issuer"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={cert.issuer}
                                    onChange={e => setResumeData(prev => ({ ...prev, certifications: prev.certifications.map(item => item.id === cert.id ? { ...item, issuer: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Date"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={cert.date}
                                    onChange={e => setResumeData(prev => ({ ...prev, certifications: prev.certifications.map(item => item.id === cert.id ? { ...item, date: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Link (Optional)"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={cert.link}
                                    onChange={e => setResumeData(prev => ({ ...prev, certifications: prev.certifications.map(item => item.id === cert.id ? { ...item, link: e.target.value } : item) }))}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Publications */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Publications</h3>
                        </div>
                        <button onClick={addPublication} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Publication
                        </button>
                    </div>
                    {resumeData.publications.map((pub) => (
                        <div key={pub.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, publications: prev.publications.filter(p => p.id !== pub.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Title"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={pub.title}
                                    onChange={e => setResumeData(prev => ({ ...prev, publications: prev.publications.map(item => item.id === pub.id ? { ...item, title: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Publisher"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={pub.publisher}
                                    onChange={e => setResumeData(prev => ({ ...prev, publications: prev.publications.map(item => item.id === pub.id ? { ...item, publisher: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Date"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={pub.date}
                                    onChange={e => setResumeData(prev => ({ ...prev, publications: prev.publications.map(item => item.id === pub.id ? { ...item, date: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Link (Optional)"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={pub.link}
                                    onChange={e => setResumeData(prev => ({ ...prev, publications: prev.publications.map(item => item.id === pub.id ? { ...item, link: e.target.value } : item) }))}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Awards */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Award className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Awards & Achievements</h3>
                        </div>
                        <button onClick={addAward} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Award
                        </button>
                    </div>
                    {resumeData.awards.map((aw) => (
                        <div key={aw.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, awards: prev.awards.filter(a => a.id !== aw.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Title"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={aw.title}
                                    onChange={e => setResumeData(prev => ({ ...prev, awards: prev.awards.map(item => item.id === aw.id ? { ...item, title: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Issuer"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={aw.issuer}
                                    onChange={e => setResumeData(prev => ({ ...prev, awards: prev.awards.map(item => item.id === aw.id ? { ...item, issuer: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Date"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={aw.date}
                                    onChange={e => setResumeData(prev => ({ ...prev, awards: prev.awards.map(item => item.id === aw.id ? { ...item, date: e.target.value } : item) }))}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Industrial Visits */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-400">
                            <MapPin className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">Industrial Visits</h3>
                        </div>
                        <button onClick={addVisit} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Visit
                        </button>
                    </div>
                    {resumeData.industrialVisits.map((iv) => (
                        <div key={iv.id} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 relative group">
                            <button
                                onClick={() => setResumeData(prev => ({ ...prev, industrialVisits: prev.industrialVisits.filter(v => v.id !== iv.id) }))}
                                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    placeholder="Company / Place"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={iv.company}
                                    onChange={e => setResumeData(prev => ({ ...prev, industrialVisits: prev.industrialVisits.map(item => item.id === iv.id ? { ...item, company: e.target.value } : item) }))}
                                />
                                <input
                                    placeholder="Date"
                                    className="bg-transparent border-b border-white/10 p-2 text-white focus:border-indigo-500 outline-none"
                                    value={iv.date}
                                    onChange={e => setResumeData(prev => ({ ...prev, industrialVisits: prev.industrialVisits.map(item => item.id === iv.id ? { ...item, date: e.target.value } : item) }))}
                                />
                            </div>
                            <textarea
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="Key Learnings..."
                                value={iv.description}
                                onChange={e => setResumeData(prev => ({ ...prev, industrialVisits: prev.industrialVisits.map(item => item.id === iv.id ? { ...item, description: e.target.value } : item) }))}
                            />
                        </div>
                    ))}
                </section>

                {/* Co-curricular Activities */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <Activity className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Co-curricular Activities</h3>
                    </div>
                    <textarea
                        rows={3}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                        placeholder="List your activities separated by commas..."
                        value={resumeData.coCurricular.join(', ')}
                        onChange={e => setResumeData({ ...resumeData, coCurricular: e.target.value.split(',').map(s => s.trim()) })}
                    />
                </section>

                {/* Hobbies */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <Heart className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Interests & Hobbies</h3>
                    </div>
                    <textarea
                        rows={2}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                        placeholder="List your hobbies separated by commas..."
                        value={resumeData.hobbies.join(', ')}
                        onChange={e => setResumeData({ ...resumeData, hobbies: e.target.value.split(',').map(s => s.trim()) })}
                    />
                </section>

                {/* Skills */}
                <section className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                        <Wand2 className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Skills</h3>
                    </div>
                    <textarea
                        rows={3}
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                        placeholder="List your skills separated by commas (e.g. React, Node.js, Project Management)..."
                        value={resumeData.skills.join(', ')}
                        onChange={e => setResumeData({ ...resumeData, skills: e.target.value.split(',').map(s => s.trim()) })}
                    />
                </section>

                <div className="flex justify-between pt-8">
                    <button
                        onClick={() => setStep(1)}
                        className="px-6 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(3)}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-white font-medium shadow-lg shadow-indigo-500/25"
                    >
                        Generate Resume
                    </button>
                </div>
            </div>
        );
    }
    // Step 3: Preview (Simple Print View) -> Now using ResumeRenderer
    if (step === 3) {
        return (
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #resume-preview, #resume-preview * {
                            visibility: visible;
                        }
                        #resume-preview {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                            overflow: visible;
                        }
                        @page {
                            margin: 0;
                            size: auto;
                        }
                        /* Hide web-only elements */
                        .print-hidden {
                           display: none !important;
                        }
                    }
                `}} />
                <div className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-white/10 sticky top-4 z-10 backdrop-blur-md print-hidden">
                    <button
                        onClick={() => setStep(2)}
                        className="text-gray-400 hover:text-white flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Edit
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                // Toggle template cycle for quick preview if desired, or go back to step 0
                                // For now, let's just stick to the current selected one.
                                setStep(0);
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Change Template
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 rounded-lg text-white font-medium flex items-center gap-2 shadow-lg transition-colors"
                        >
                            {isGeneratingPdf ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                            ) : (
                                <><Download className="w-4 h-4" /> Download PDF</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Interactive Preview using Renderer */}
                <div className="flex flex-col items-center w-full">
                    <ResumeRenderer
                        templateId={templateId || 'modern'}
                        data={resumeData}
                        id="resume-preview"
                    />
                </div>
            </div>
        );
    }

    return null;
}
