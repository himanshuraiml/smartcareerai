import {
    GraduationCap, Building2, Briefcase, FileText,
    Mic, Target, Rocket, LineChart, BrainCircuit,
    ShieldCheck, Database, LayoutDashboard, Users, TrendingUp, Gem
} from 'lucide-react';

export const platformSolutions = [
    {
        id: 'students',
        shortDesc: 'ATS resumes, mock interviews & skill badges.',
        title: 'For Students',
        description: 'Stop guessing what recruiters want. PlaceNxt provides an automated, AI-guided path to guarantee placement readiness from day one.',
        icon: GraduationCap,
        color: 'from-blue-500 to-cyan-500',
        features: [
            { icon: FileText, text: 'ATS Resume Scoring' },
            { icon: Mic, text: 'AI-Led Mock Interviews' },
            { icon: Target, text: 'Verified Skill Badges' },
            { icon: Rocket, text: 'Smart Job Matching' }
        ]
    },
    {
        id: 'university',
        shortDesc: 'Campus analytics & placement management.',
        title: 'For University',
        description: 'Supercharge your placement cell. Track student progress in real-time, identify skill gaps, and boost your university\'s placement ROI effortlessly.',
        icon: Building2,
        color: 'from-purple-500 to-pink-500',
        features: [
            { icon: LineChart, text: 'Batch Performance Tracking' },
            { icon: BrainCircuit, text: 'Skill Gap Analytics' },
            { icon: ShieldCheck, text: 'White-Labeled Portal' },
            { icon: Database, text: 'Corporate Talent Export' }
        ]
    },
    {
        id: 'recruiter',
        shortDesc: 'AI pre-screening & automated hiring.',
        title: 'For Recruiters',
        description: 'Hire faster and better. AI pre-screens and ranks candidates based on proven skills, not just keywords, cutting time-to-hire by 80%.',
        icon: Briefcase,
        color: 'from-emerald-500 to-teal-500',
        features: [
            { icon: Users, text: 'Pre-Vetted Talent Pools' },
            { icon: LayoutDashboard, text: 'Automated Interviewing' },
            { icon: TrendingUp, text: 'Predictive Fit Scoring' },
            { icon: Gem, text: 'Custom Skill Workflows' }
        ]
    }
];
