export interface ComparisonItem {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    heroLabel: string;
    competitorName: string;
    competitorTagline: string;
    competitorDescription: string;
    stats: { label: string; placenxt: string; competitor: string }[];
    whyBetter: string[];
    competitorWeaknesses: string[];
    switchReasons: { title: string; desc: string }[];
    matrix: {
        feature: string;
        placenxt: string | boolean;
        competitor: string | boolean;
    }[];
    ctaText: string;
    ctaHref: string;
}

export const COMPARE_ITEMS: Record<string, ComparisonItem> = {
    'unstop': {
        slug: 'unstop',
        title: 'PlaceNxt vs Unstop',
        subtitle: 'Why placement cells are switching from event-centric platforms to AI-powered career infrastructure.',
        description: 'PlaceNxt goes beyond competitions and hackathons. We deliver end-to-end AI career preparation — from ATS resume scoring to verified skill badges and AI mock interviews — all in a single campus-ready platform.',
        heroLabel: 'Head-to-Head Comparison 2026',
        competitorName: 'Unstop',
        competitorTagline: 'Events and competitions first, career readiness second.',
        competitorDescription: 'Unstop is built around campus competitions and hiring challenges. While great for brand visibility, it lacks the deep AI tooling students need for resume optimization, skill verification, and behavioral interview preparation.',
        stats: [
            { label: 'Resume ATS Scoring', placenxt: 'Real-time AI', competitor: 'None' },
            { label: 'Skill Verification', placenxt: 'Proctored Badges', competitor: 'Competition-based' },
            { label: 'Mock Interviews', placenxt: 'Unlimited AI Sessions', competitor: 'Not available' },
        ],
        whyBetter: [
            'Real-time ATS resume analysis aligned to specific job descriptions — not generic templates.',
            'Proctored skill badge tests across 50+ technical domains that recruiters trust and filter by.',
            'AI-powered mock interview sessions with structured behavioral feedback after every round.',
            'Campus institutional dashboards tracking cohort progress, badge rates, and placement funnels.',
            'Full recruiter pipeline with verified candidate pools — not just event leaderboards.',
        ],
        competitorWeaknesses: [
            'No AI resume scoring or ATS gap analysis for students.',
            'Skill recognition is competition-based, not formally verifiable by recruiters.',
            'No behavioral or AI mock interview preparation engine.',
            'Recruiter CRM limited to event shortlisting with no pipeline management.',
        ],
        switchReasons: [
            { title: 'Beyond Leaderboards', desc: 'Competitions measure performance in a contest. PlaceNxt measures real-world job readiness through ATS scores, verified badges, and interview simulations.' },
            { title: 'Recruiter-Ready Pipelines', desc: 'Recruiters on PlaceNxt get pre-vetted candidate pipelines with verified skill data — not just event top-performers without context.' },
            { title: 'Always-On Preparation', desc: "Students don't wait for the next competition. PlaceNxt provides continuous resume scoring, learning paths, and mock sessions 24/7 year-round." },
        ],
        matrix: [
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'Proctored Skill Tests', placenxt: 'Proctored + Verified Badges', competitor: 'Competition scores only' },
            { feature: 'AI Mock Interviews', placenxt: true, competitor: false },
            { feature: 'Campus Institutional Portal', placenxt: true, competitor: 'Basic event dashboard' },
            { feature: 'ATS Keyword Optimization', placenxt: true, competitor: false },
            { feature: 'Recruiter Pipeline CRM', placenxt: 'Full visual kanban pipeline', competitor: 'Event shortlisting only' },
            { feature: 'Candidate Skill Radars', placenxt: true, competitor: false },
            { feature: 'Batch Analytics Dashboard', placenxt: true, competitor: 'Participation metrics only' },
            { feature: 'Verified Public Skill Profile', placenxt: true, competitor: 'Leaderboard rankings' },
        ],
        ctaText: 'See PlaceNxt vs Unstop in Action',
        ctaHref: '/contact?type=demo',
    },

    'hackerrank': {
        slug: 'hackerrank',
        title: 'PlaceNxt vs HackerRank',
        subtitle: 'Why early-career teams are choosing full-stack career AI over coding-only test portals.',
        description: 'HackerRank excels at coding challenges. PlaceNxt delivers the complete picture — ATS resume scoring, behavioral interview AI, campus placement portals, and verified skill credentialing — for the full early-career hiring funnel.',
        heroLabel: 'Head-to-Head Comparison 2026',
        competitorName: 'HackerRank',
        competitorTagline: 'Coding tests without the career context.',
        competitorDescription: 'HackerRank is the go-to for technical coding screens. But once the test is done, teams are left to manually sift results, verify resumes, and schedule behavioral rounds — all outside the platform with no continuity.',
        stats: [
            { label: 'Resume Analysis', placenxt: 'AI-Powered ATS', competitor: 'Not available' },
            { label: 'Behavioral Interviews', placenxt: 'AI Video + Feedback', competitor: 'Not available' },
            { label: 'Campus Portal', placenxt: 'All Tiers', competitor: 'Enterprise only' },
        ],
        whyBetter: [
            'End-to-end hiring intelligence: from resume ATS scoring to technical tests to behavioral interviews.',
            'Student-facing career tools so candidates arrive interview-ready, reducing rejection rates.',
            'Campus institutional dashboards giving placement officers real visibility into batch skill gaps.',
            'Verified skill badges that persist beyond test results and are displayed on public profiles.',
            'Built-in ATS matching ensures candidates applying to your roles are genuinely qualified.',
        ],
        competitorWeaknesses: [
            'No student-facing career preparation tools — only employer-side screening.',
            'Resume parsing and ATS alignment not part of the core offering.',
            'Behavioral and communication assessments require external platforms.',
            'Campus placement management dashboards locked behind costly enterprise tiers.',
        ],
        switchReasons: [
            { title: 'Two-Sided Platform', desc: 'HackerRank serves recruiters. PlaceNxt serves both sides — students prepare better, companies screen faster, and placement offices get full visibility.' },
            { title: 'Beyond the Coding Round', desc: 'Technical screens are just step one. PlaceNxt integrates resume AI, behavioral mocks, and cohort analytics to cover the entire hiring funnel.' },
            { title: 'Verified Credentials', desc: 'PlaceNxt badges are proctored and publicly shareable — students carry their verified skills forward to every application they make.' },
        ],
        matrix: [
            { feature: 'Technical Code Assessment', placenxt: 'Full sandbox + AI analysis', competitor: 'Market-leading code tests' },
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'Behavioral Video Interviews', placenxt: 'AI-evaluated mock sessions', competitor: false },
            { feature: 'ATS Keyword Optimization', placenxt: true, competitor: false },
            { feature: 'Campus Institutional Portal', placenxt: 'All tiers included', competitor: 'Enterprise only' },
            { feature: 'Student Career Prep Tools', placenxt: true, competitor: false },
            { feature: 'Verified Public Skill Badges', placenxt: true, competitor: 'Certificate PDFs only' },
            { feature: 'Recruiter Pipeline CRM', placenxt: 'Visual kanban + skill filters', competitor: 'Basic result export' },
            { feature: 'Batch Cohort Analytics', placenxt: true, competitor: 'Limited reporting' },
        ],
        ctaText: 'See the Full PlaceNxt Feature Set',
        ctaHref: '/contact?type=demo',
    },

    'hackerearth': {
        slug: 'hackerearth',
        title: 'PlaceNxt vs HackerEarth',
        subtitle: 'Why AI-powered career infrastructure wins over hackathon-first hiring platforms.',
        description: 'HackerEarth handles technical tests and hackathons well. PlaceNxt extends hiring intelligence with AI resume scoring, behavioral interview practice, and deep campus placement analytics absent in HackerEarth.',
        heroLabel: 'Head-to-Head Comparison 2026',
        competitorName: 'HackerEarth',
        competitorTagline: 'Assessment engine without the career layer.',
        competitorDescription: 'HackerEarth offers solid coding assessments and hackathon management. But it leaves students without career preparation resources and recruiters without a unified pipeline connecting assessments to sourcing.',
        stats: [
            { label: 'AI Career Prep', placenxt: 'Full Suite', competitor: 'Not available' },
            { label: 'Student Engagement', placenxt: 'Daily active tools', competitor: 'Per-event only' },
            { label: 'Campus Portal', placenxt: 'Multi-college', competitor: 'Single org view' },
        ],
        whyBetter: [
            'Seamlessly connects candidate assessment with resume scoring and behavioral interview readiness.',
            'Students use PlaceNxt daily for career prep — not just when an employer runs a hackathon.',
            'Multi-institutional campus dashboards that track entire cohort progress over full semesters.',
            'Verified skill badges earned post-assessment are publicly shareable directly on LinkedIn.',
            'Recruiter pipelines pull pre-scored, pre-verified candidates directly — reducing time-to-offer.',
        ],
        competitorWeaknesses: [
            'No AI resume scoring or ATS optimization guidance for candidates.',
            'Student engagement is purely event-driven with no ongoing career infrastructure.',
            'No behavioral or mock interview AI for ongoing preparation.',
            'Multi-college institutional management requires separate enterprise agreements.',
        ],
        switchReasons: [
            { title: 'Continuity of Preparation', desc: "HackerEarth fires up when an employer starts a challenge. PlaceNxt gives students career tools year-round, so they're always ready when opportunities arrive." },
            { title: 'Unified Hiring Funnel', desc: 'Instead of switching between assessment platforms and sourcing tools, PlaceNxt connects skill tests, resume scoring, and recruiter pipelines in one workflow.' },
            { title: 'Institutional Scale', desc: 'Placement officers at PlaceNxt partner colleges get real-time cohort analytics, not just individual candidate scores after each event.' },
        ],
        matrix: [
            { feature: 'Technical Coding Tests', placenxt: 'Sandbox + AI scoring', competitor: 'Strong assessment engine' },
            { feature: 'Hackathon Management', placenxt: 'Basic', competitor: 'Full-featured hackathons' },
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'Mock Interview AI', placenxt: true, competitor: false },
            { feature: 'ATS Keyword Optimization', placenxt: true, competitor: false },
            { feature: 'Student Daily Career Tools', placenxt: true, competitor: 'Event-only engagement' },
            { feature: 'Verified Skill Badges', placenxt: 'Proctored + publicly shareable', competitor: 'Test result certificates' },
            { feature: 'Campus Multi-College Portal', placenxt: true, competitor: 'Enterprise only' },
            { feature: 'Recruiter CRM Pipeline', placenxt: 'Full pipeline with filters', competitor: 'Basic shortlisting export' },
        ],
        ctaText: 'Request a Campus Demo',
        ctaHref: '/contact?type=demo',
    },

    'internshala': {
        slug: 'internshala',
        title: 'PlaceNxt vs Internshala',
        subtitle: 'Why verified career readiness outperforms unfiltered internship listings for modern recruiters.',
        description: 'Internshala connects students to internships through a traditional job board model. PlaceNxt verifies students before they ever apply — ATS scoring, skill badges, mock interviews — so every candidate that reaches you is genuinely ready.',
        heroLabel: 'Head-to-Head Comparison 2026',
        competitorName: 'Internshala',
        competitorTagline: 'Large talent pool with no quality signal.',
        competitorDescription: "Internshala's vast database of student profiles is valuable for volume. But without pre-screening, badge verification, or ATS filtering, recruiters still spend hours manually vetting every applicant to find qualified candidates.",
        stats: [
            { label: 'Candidate Vetting', placenxt: 'AI Pre-screened', competitor: 'Self-reported only' },
            { label: 'Skill Verification', placenxt: 'Verified Badges', competitor: 'Unverified claims' },
            { label: 'Interview Tools', placenxt: 'Built-in AI Mock', competitor: 'External required' },
        ],
        whyBetter: [
            'Every candidate in the PlaceNxt pipeline carries an ATS score, verified skill badges, and mock interview ratings.',
            'Recruiter time-to-shortlist drops significantly with AI-filtered, pre-vetted applicant pools.',
            'Campus placement offices get real placement funnel analytics — not just raw application counts.',
            'Students prepare within the same platform where they apply, ensuring consistent quality at every stage.',
            'Integrated behavioral and technical assessment before applications are even submitted.',
        ],
        competitorWeaknesses: [
            'No skill verification — any candidate can self-report any technology stack.',
            'No AI resume analysis or ATS optimization for applying students.',
            'High application volume with low signal means heavy manual screening overhead.',
            'No behavioral or technical interview infrastructure integrated with the job listing flow.',
        ],
        switchReasons: [
            { title: 'Quality Over Quantity', desc: 'Internshala sends you every applicant. PlaceNxt sends you verified candidates — scored, tested, and interview-ready before they hit your pipeline.' },
            { title: 'End-to-End Intelligence', desc: 'From a student uploading their resume to a recruiter scheduling an interview, every step on PlaceNxt generates actionable data.' },
            { title: 'Institutional Accountability', desc: "Placement officers at partner colleges see exactly where their batch stands — skill gaps, mock interview scores, ATS readiness — not just application counts." },
        ],
        matrix: [
            { feature: 'Talent Pool Size', placenxt: 'Targeted early-career', competitor: 'Large unfiltered database' },
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'Candidate Skill Verification', placenxt: 'Proctored badge tests', competitor: 'Self-declared only' },
            { feature: 'ATS Optimization Tools', placenxt: true, competitor: false },
            { feature: 'Mock Interview Platform', placenxt: 'AI-led sessions built-in', competitor: false },
            { feature: 'Pre-screened Applicant Pool', placenxt: 'AI-filtered before apply', competitor: 'Manual screening required' },
            { feature: 'Recruiter Pipeline CRM', placenxt: 'Visual kanban with skill filters', competitor: 'Basic applicant list' },
            { feature: 'Campus Placement Analytics', placenxt: 'Full cohort radar dashboard', competitor: 'Basic application counts' },
            { feature: 'Verified Candidate Profiles', placenxt: true, competitor: false },
        ],
        ctaText: 'Access Pre-Verified Talent Now',
        ctaHref: '/solutions/recruiter',
    },

    'imocha': {
        slug: 'imocha',
        title: 'PlaceNxt vs iMocha',
        subtitle: 'Why all-in-one career AI beats a standalone assessment engine for campus deployment.',
        description: 'iMocha offers a wide library of skill tests. PlaceNxt combines assessments with AI resume scoring, mock interview practice, campus institutional portals, and recruiter pipelines — the complete career intelligence platform.',
        heroLabel: 'Head-to-Head Comparison 2026',
        competitorName: 'iMocha',
        competitorTagline: 'Tests without the career ecosystem.',
        competitorDescription: 'iMocha is a capable skill testing library but fundamentally recruiter-side tooling. Students receive no preparation resources, and recruiters must piece together separate tools for sourcing, ATS, and interview scheduling.',
        stats: [
            { label: 'Student Prep Tools', placenxt: 'Complete Suite', competitor: 'None' },
            { label: 'Resume Intelligence', placenxt: 'AI ATS Scoring', competitor: 'Not included' },
            { label: 'Platform Coverage', placenxt: 'Student + Recruiter + Campus', competitor: 'Recruiter only' },
        ],
        whyBetter: [
            'Students arrive at assessments already prepared — having scored resumes, practiced mocks, and earned skill badges on the same platform.',
            'Campus placement officers track entire cohort readiness before assessment results even come in.',
            'Behavioral AI interview rounds are built-in — not a separate enterprise tool purchase.',
            'Recruiter pipelines display verified skill badge data alongside assessment scores in one unified view.',
            'Transparent subscription pricing with no per-assessment seat fees for campus deployments.',
        ],
        competitorWeaknesses: [
            'No student-facing career preparation or AI resume optimization tools.',
            'Per-assessment seat pricing becomes expensive at campus scale with large batches.',
            'Behavioral and communication assessments limited in depth and feedback quality.',
            'No campus placement management or cohort-level progress analytics.',
        ],
        switchReasons: [
            { title: 'Preparation Meets Assessment', desc: 'When students prep on the same platform where they get assessed, scores are higher, ghosting drops, and time-to-hire shrinks significantly.' },
            { title: 'Campus-Scale Economics', desc: 'PlaceNxt subscription pricing for institutions removes per-seat cost shock. One plan covers your entire batch — no counting assessment credits.' },
            { title: 'Unified View for Recruiters', desc: 'Instead of stitching together an assessment tool, an ATS, and an interview scheduler, PlaceNxt gives recruiters one dashboard with all the signal they need.' },
        ],
        matrix: [
            { feature: 'Skill Test Library', placenxt: '50+ verified domains', competitor: '2500+ test library' },
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'ATS Keyword Optimization', placenxt: true, competitor: false },
            { feature: 'Behavioral Video Interviews', placenxt: 'AI-scored sessions', competitor: 'Limited proctoring only' },
            { feature: 'Student Prep Platform', placenxt: true, competitor: false },
            { feature: 'Campus Institutional Portal', placenxt: true, competitor: false },
            { feature: 'Recruiter Pipeline CRM', placenxt: 'Visual kanban + filters', competitor: 'Result export only' },
            { feature: 'Verified Public Skill Badges', placenxt: true, competitor: 'Test result certificates' },
            { feature: 'Cohort Analytics Dashboard', placenxt: true, competitor: false },
        ],
        ctaText: 'Compare Full Feature Sets Live',
        ctaHref: '/contact?type=demo',
    },

    'talview': {
        slug: 'talview',
        title: 'PlaceNxt vs Talview',
        subtitle: 'Why integrated campus placement infrastructure outperforms standalone AI video interviewing.',
        description: 'Talview specializes in video assessments and remote proctoring. PlaceNxt delivers a complete early-career suite — connecting AI resume scoring, proctored skill badge tests, unlimited behavioral mock interviews, and visual recruiter pipelines for modern campuses.',
        heroLabel: 'Head-to-Head Comparison 2026',
        competitorName: 'Talview',
        competitorTagline: 'Corporate AI interviewing without campus placement infrastructure.',
        competitorDescription: 'Talview provides robust enterprise video interviewing and proctoring. However, it lacks the student-facing preparation tools (like ATS resume checkers and learning tracks) and the campus-wide placement drive workflows that universities need.',
        stats: [
            { label: 'Student Career Prep', placenxt: 'Always-On AI Tools', competitor: 'Assessment-only' },
            { label: 'Resume ATS Analysis', placenxt: 'Real-Time Scoring', competitor: 'Not available' },
            { label: 'Campus Drive Workflow', placenxt: 'Full TPO Automation', competitor: 'Limited' },
        ],
        whyBetter: [
            'End-to-end placement suite: bridges student preparation, verification, and employer sourcing.',
            'Always-on practice portals for students to run mock interviews and ATS resume scans 24/7.',
            'Co-branded campus portals that let placement officers manage student logs, resumes, and batch statistics.',
            'Direct recruiter pipelines where companies can view verified skill badges alongside interview recordings.',
            'Flexible campus licensing with unlimited mock interview practice sessions for all registered students.',
        ],
        competitorWeaknesses: [
            'No student-facing career preparation tools or ATS keyword checkers.',
            'Pricing structures charge per test/candidate, making large-scale campus practice cost-prohibitive.',
            'Designed primarily for corporate screening rather than university placement offices.',
            'No public-facing verified badges that candidates can carry to external job searches.',
        ],
        switchReasons: [
            { title: 'Prep Meets Assessment', desc: 'Talview is a high-stakes screening tool. PlaceNxt is a growth platform where students practice mock interviews repeatedly until they are ready to excel.' },
            { title: 'Campus-Wide Automation', desc: 'PlaceNxt automates the entire placement lifecycle (jobs, student registrations, eligibility criteria) rather than just video screening.' },
            { title: 'Verified Career Profiles', desc: 'PlaceNxt badges are proctored, verifiable credentials that students display on public profiles, giving them permanent value.' },
        ],
        matrix: [
            { feature: 'AI Video Interviewing', placenxt: 'Interactive AI mock + feedback', competitor: 'Asynchronous video assessment' },
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'ATS Optimization guidance', placenxt: true, competitor: false },
            { feature: 'Proctored Skill Badges', placenxt: 'Verifiable credentials', competitor: 'Test certificates' },
            { feature: 'Campus Placement Portal', placenxt: 'Included in TPO dashboard', competitor: 'No placement CRM' },
            { feature: 'Candidate Practice Mode', placenxt: 'Unlimited mock sessions', competitor: 'Assessment invitation only' },
            { feature: 'Recruiter Kanban Pipeline', placenxt: true, competitor: 'Candidate list output' },
            { feature: 'Batch Readiness Analytics', placenxt: true, competitor: 'Individual test scores' },
        ],
        ctaText: 'Discover the PlaceNxt Difference',
        ctaHref: '/contact?type=demo',
    },

    'placement-alternatives': {
        slug: 'placement-alternatives',
        title: 'Looking for an Unstop Alternative?',
        subtitle: 'Why placement teams are choosing AI-first career platforms over event-based campus tools.',
        description: 'Colleges need more than just a competition hub. PlaceNxt provides co-branded institutional portals, cohort progress radars, and batched analytics reporting — built for year-round placement operations.',
        heroLabel: 'Platform Comparison 2026',
        competitorName: 'Event-Based Platforms',
        competitorTagline: 'Designed for competitions, not careers.',
        competitorDescription: 'Event-based platforms are great for brand visibility during hiring drives. But they lack the continuous career infrastructure — resume AI, skill verification, mock interviews — that students and placement cells need year-round.',
        stats: [
            { label: 'Career Prep Continuity', placenxt: 'Year-round', competitor: 'Event-driven only' },
            { label: 'Institutional Analytics', placenxt: 'Full cohort radar', competitor: 'Participation counts' },
            { label: 'Verified Credentials', placenxt: 'Proctored badges', competitor: 'None' },
        ],
        whyBetter: [
            'Co-branded portals for colleges and corporate partners with custom branding.',
            'Consolidated performance dashboards with skill gap radar for academic staff.',
            'Automated email invitations and visual pipeline routing for batch placement drives.',
            'Year-round student engagement through daily AI career tools — not just during events.',
            'Verified skill badges shareable on LinkedIn directly from student profiles.',
        ],
        competitorWeaknesses: [
            'Engagement drops to near-zero between competition cycles.',
            'No resume or ATS optimization tools for students.',
            'Placement metrics limited to participation and leaderboard rankings.',
            'No formal skill verification that recruiters can filter by.',
        ],
        switchReasons: [
            { title: 'Infrastructure Over Events', desc: 'Events create moments. PlaceNxt creates a permanent career readiness layer for your institution that works 365 days a year.' },
            { title: 'Measurable Placement Outcomes', desc: 'Track how ATS scores, badge completion rates, and mock interview ratings correlate with actual placement outcomes — semester over semester.' },
            { title: 'Recruiter Trust Through Verification', desc: 'Companies return to PlaceNxt partner colleges because they trust the verification layer. Every candidate carries proctored credentials, not self-reported claims.' },
        ],
        matrix: [
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'Co-Branded Campus Portal', placenxt: true, competitor: 'Custom build required' },
            { feature: 'Batch Analytics Radar', placenxt: true, competitor: false },
            { feature: 'Year-Round Student Engagement', placenxt: true, competitor: 'Event periods only' },
            { feature: 'Verified Skill Badges', placenxt: 'Proctored and shareable', competitor: 'None' },
            { feature: 'Mock Interview AI', placenxt: true, competitor: false },
            { feature: 'Recruiter Pipeline CRM', placenxt: 'Full visual kanban', competitor: 'Event shortlisting' },
            { feature: 'Alumni Network Tracking', placenxt: true, competitor: 'Separate spreadsheet' },
            { feature: 'ATS Keyword Optimization', placenxt: true, competitor: false },
        ],
        ctaText: 'Request Institutional Dashboard Demo',
        ctaHref: '/contact?type=demo',
    },

    'assessment-alternatives': {
        slug: 'assessment-alternatives',
        title: 'Looking for a HackerRank Alternative?',
        subtitle: 'Full-stack career AI that goes beyond the coding round for early-career hiring.',
        description: 'PlaceNxt evaluates both technical logic via dynamic code tests and behavioral communication via AI-driven mock interviews — plus the ATS resume scoring and campus portals that HackerRank leaves out.',
        heroLabel: 'Platform Comparison 2026',
        competitorName: 'Coding-Only Platforms',
        competitorTagline: 'Strong tests, weak career pipeline.',
        competitorDescription: 'Standalone coding assessment platforms do one thing well: code screens. But hiring is a multi-step process. Resume review, behavioral rounds, cohort management, and candidate sourcing still require entirely separate tools.',
        stats: [
            { label: 'Resume Intelligence', placenxt: 'AI ATS Scoring', competitor: 'Not included' },
            { label: 'Behavioral Assessment', placenxt: 'AI video + scoring', competitor: 'Not available' },
            { label: 'Student Prep Side', placenxt: 'Full career tools', competitor: 'None' },
        ],
        whyBetter: [
            'AI-led spoken behavioral mock interview analysis with structured competency scoring.',
            'Automated code evaluation and time/space complexity analysis built into assessment reports.',
            'Consolidated scorecard integrating resume ATS score + tech test + behavioral rating in one view.',
            'Campus placement cells get cohort dashboards — not just per-candidate test exports.',
            'Students use the same platform to prep, so assessment scores reflect true readiness.',
        ],
        competitorWeaknesses: [
            'No student-facing career preparation or AI resume tools.',
            'Behavioral and communication rounds require separate external platforms.',
            'Campus placement management requires separate enterprise add-ons.',
            'No unified scorecard connecting technical test results to resume quality.',
        ],
        switchReasons: [
            { title: 'One Platform, Full Funnel', desc: 'From a student uploading a resume to a recruiter scheduling an offer call, every step happens — and is measured — in PlaceNxt.' },
            { title: 'Students Arrive Prepared', desc: 'Because students prep on PlaceNxt, their assessment scores are higher, ghosting is lower, and time-to-hire shrinks dramatically.' },
            { title: 'Verified Beyond the Test', desc: 'Skill badges, ATS scores, and behavioral ratings create a rich candidate profile that goes far beyond a single test result PDF.' },
        ],
        matrix: [
            { feature: 'Technical Code Sandbox', placenxt: true, competitor: true },
            { feature: 'AI Resume Scoring', placenxt: true, competitor: false },
            { feature: 'Behavioral Video Scoring', placenxt: true, competitor: false },
            { feature: 'Consolidated Scorecard', placenxt: true, competitor: 'Separate PDFs' },
            { feature: 'ATS Keyword Optimization', placenxt: true, competitor: false },
            { feature: 'Student Prep Platform', placenxt: true, competitor: false },
            { feature: 'Campus Institutional Portal', placenxt: true, competitor: 'Enterprise only' },
            { feature: 'Verified Skill Badges', placenxt: true, competitor: 'Certificate only' },
            { feature: 'ATS System Sync', placenxt: true, competitor: false },
        ],
        ctaText: 'See the Full PlaceNxt Platform',
        ctaHref: '/contact?type=demo',
    },
};

export interface GuideItem {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    author: string;
    readTime: string;
    sections: {
        heading: string;
        body: string;
    }[];
}

export const GUIDE_ITEMS: Record<string, GuideItem> = {
    'student-tools': {
        slug: 'student-tools',
        title: 'Best Placement Prep Tools for Students in 2026',
        subtitle: 'A complete guide to AI-powered career tools that get early-career candidates hired faster.',
        description: 'From ATS resume scanners to AI mock interview platforms, this handbook covers everything a final-year student needs to maximize placement success.',
        author: 'PlaceNxt Career Team',
        readTime: '8 min read',
        sections: [
            {
                heading: '1. AI Resume Scoring vs. Basic Builders',
                body: 'Static resume builders simply format your text. Modern ATS-aware scorers like PlaceNxt analyze your resume against the actual job description, identifying keyword gaps, formatting issues, and relevance scores in real-time. For every application, you should be running an ATS check before submitting — studies show ATS-aligned resumes receive 3× more interview calls than unoptimized ones.',
            },
            {
                heading: '2. Verified Skill Badges Beat Self-Reported Claims',
                body: 'Writing "proficient in Java" carries no weight with experienced recruiters. Earning a proctored, verifiable skill badge — taken under secure conditions with randomized questions — signals genuine competence. Platforms like PlaceNxt issue publicly shareable badges linked to your profile, which appear directly in recruiter search filters and LinkedIn.',
            },
            {
                heading: '3. Mock Interview AI Prepares You at Scale',
                body: 'Scheduling mock interviews with seniors or mentors is unreliable and inconsistent. AI mock interview platforms give you structured behavioral rounds on-demand, with scored feedback on communication clarity, technical accuracy, and confidence markers. Data from placement cells consistently shows that students who complete 5+ mock sessions have 40% higher offer-acceptance rates.',
            },
            {
                heading: '4. Integrated Platforms Win Over Point Solutions',
                body: "Using separate tools for resume building, skill tests, and interview prep creates friction and breaks your workflow. End-to-end platforms that connect preparation with application — where your ATS score, badge results, and mock ratings all contribute to your recruiter-facing profile — produce consistently better placement outcomes across every batch.",
            },
        ],
    },

    'campus-hiring': {
        slug: 'campus-hiring',
        title: 'Best Platforms for Campus Hiring in 2026',
        subtitle: 'How placement officers and recruiters are replacing legacy processes with AI-verified pipelines.',
        description: 'A resource guide for placement cells and recruitment managers comparing modern campus hiring platforms by feature coverage, scalability, and verified candidate quality.',
        author: 'PlaceNxt Talent Acquisition Group',
        readTime: '12 min read',
        sections: [
            {
                heading: '1. The Shift From Events to Infrastructure',
                body: 'Campus hiring used to mean organizing a recruitment drive and hoping enough qualified students showed up. Leading placement cells now maintain year-round digital infrastructure — skill test leaderboards, ATS-scored resume vaults, and pipeline dashboards — so every batch is always placement-ready. The best platforms make this the default, not an add-on.',
            },
            {
                heading: '2. Solving the Assessment Integrity Problem',
                body: 'Online assessments without proctoring are compromised assessments. Platforms with browser-lock enforcement, webcam monitoring, and randomized question pools produce scores that actually reflect candidate ability. This directly improves offer-acceptance rates, because hired candidates genuinely meet the technical bar — reducing costly early attrition.',
            },
            {
                heading: '3. From Spreadsheets to Pipeline Analytics',
                body: "Most placement offices still track candidate progress in Excel. Modern kanban-style pipelines with automated stage transitions, reminder triggers, and skill-radar overlays don't just save time — they surface insights spreadsheets can't: which skill domain is weakest this batch, where candidates are dropping out of the funnel, and which companies are under-tapping verified pools.",
            },
            {
                heading: '4. Choosing a Platform That Serves Both Sides',
                body: 'The most effective campus hiring platforms serve recruiters and students simultaneously. When students prep on the same platform where employers source, signal quality is higher, context is richer, and the gap between screening round and job offer shrinks dramatically. Platforms that are recruiter-only leave the most important variable — candidate readiness — entirely uncontrolled.',
            },
        ],
    },
};
