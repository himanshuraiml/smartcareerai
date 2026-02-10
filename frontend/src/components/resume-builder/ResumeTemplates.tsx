'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Loader2, Check, ArrowRight, Layout } from 'lucide-react';
import ResumeRenderer from './ResumeRenderer';

interface Template {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    category: string;
}

interface ResumeTemplatesProps {
    onSelect: (templateId: string) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Mock Data for Previews
const mockResumeData = {
    personal: {
        fullName: 'Michael Harris',
        email: 'michael@email.com',
        phone: '+61 412 345 678',
        linkedin: 'linkedin.com/in/michaelharris',
        portfolio: 'michael.design',
        summary: 'Results-oriented marketing professional with 5+ years of experience in digital strategy, brand growth, and content creation. Proven ability to drive engagement and ROI.',
    },
    experience: [
        {
            id: '1',
            company: 'XYZ Corp',
            role: 'Marketing Manager',
            startDate: 'Jan 2022',
            endDate: 'Present',
            current: true,
            description: '• Led team of 5 in executing digital strategies.\n• Achieved 35% increase in web traffic.',
        },
        {
            id: '2',
            company: 'ABC Solutions',
            role: 'Digital Specialist',
            startDate: '2018',
            endDate: '2021',
            current: false,
            description: '• Executed SEO/SEM strategies, +25% organic traffic.\n• Managed Google Ads campaigns.',
        },
    ],
    education: [
        {
            id: '1',
            school: 'University of Sydney',
            degree: 'Bachelor of Marketing',
            field: 'Digital Strategy',
            startDate: '2015',
            endDate: '2018',
            grade: '3.8 GPA',
        },
    ],
    skills: ['SEO', 'Google Analytics', 'Content Marketing', 'Social Media', 'Project Management'],
    internships: [],
    projects: [
        {
            id: 'p1',
            title: 'Rebranding Campaign',
            description: 'Led a complete rebranding initiative for a major client.',
            technologies: ['Adobe CC', 'Figma'],
            link: 'behance.net/project'
        }
    ],
    certifications: [
        { id: 'c1', name: 'Google Analytics', issuer: 'Google', date: '2021', link: '' }
    ],
    industrialTraining: [],
    publications: [],
    awards: [],
    coCurricular: [],
    industrialVisits: [],
    hobbies: ['Photography', 'Cycling'],
};

export default function ResumeTemplates({ onSelect }: ResumeTemplatesProps) {
    const { accessToken } = useAuthStore();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch(`${API_URL}/resumes/templates`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data.data || []);
                }
            } catch (err) {
                console.error('Failed to load templates', err);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) fetchTemplates();
    }, [accessToken]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                <p className="text-gray-400">Loading templates...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-2">Choose a Resume Template</h2>
                <p className="text-gray-400">Select a professionally designed template to get started. All templates are ATS-optimized and support your new sections.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template) => (
                    <div
                        key={template.id}
                        onClick={() => setSelectedId(template.id)}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 flex flex-col
                            ${selectedId === template.id
                                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-900/10'
                                : 'border-white/5 hover:border-indigo-500/50 hover:bg-white/5'
                            }`}
                    >
                        {/* Renderer Preview Container */}
                        <div className="relative w-full aspect-[210/297] bg-gray-100 overflow-hidden m-0">
                            {/* 
                                Scaling Trick: 
                                ResumeRenderer is fixed at max-w-[800px]. 
                                We want to fit it into this small container.
                                Scale = containerWidth / 800.
                                
                                Let's assume the container width is roughly 300px on desktop. 
                                300/800 = 0.375.
                                We'll use a fixed scale and transform-origin.
                             */}
                            <div className="absolute top-0 left-0 w-[800px] h-auto origin-top-left transform scale-[0.4] pointer-events-none select-none">
                                <ResumeRenderer
                                    templateId={template.id}
                                    data={mockResumeData}
                                    id={`preview-${template.id}`}
                                />
                            </div>

                            {/* Overlay to prevent interaction with the resume content itself */}
                            <div className="absolute inset-0 z-10" />

                            {/* Selected Overlay */}
                            {selectedId === template.id && (
                                <div className="absolute inset-0 bg-indigo-600/20 z-20 flex items-center justify-center backdrop-blur-[1px]">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl transform scale-100 transition-transform ring-4 ring-white/20">
                                        <Check className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className={`absolute inset-0 bg-black/40 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${selectedId === template.id ? 'hidden' : ''}`}>
                                <span className="px-5 py-2 rounded-full bg-white text-gray-900 font-semibold text-sm shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 hover:scale-105">
                                    Preview
                                </span>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/5 flex-grow flex flex-col justify-end">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-white">{template.name}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-gray-300">
                                    {template.category}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                    onClick={() => selectedId && onSelect(selectedId)}
                    disabled={!selectedId}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                >
                    Continue with Selected Template
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
