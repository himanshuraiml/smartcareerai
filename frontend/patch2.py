import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# I need to insert the missing constants and the FormSection component just before `export default function AIInterviewConfig`

missing_code = """
// ── HELPER COMPONENTS & CONSTANTS ──────────────────────────────────────────

const FormSection = ({ title, subtitle, children }: { title: string, subtitle?: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {children}
    </div>
);

const aiTypeOptions = [
    { value: "TECHNICAL", label: "Technical", desc: "Algorithms, system design, coding", icon: Code2 },
    { value: "BEHAVIORAL", label: "Behavioral", desc: "Soft skills, culture, past experience", icon: Users },
    { value: "MIXED", label: "Mixed", desc: "Blend of technical & behavioral", icon: Brain },
    { value: "HR_SCREENING", label: "HR Screening", desc: "Initial HR / cultural round", icon: MessageSquare },
] as const;

type ScoringWeights = {
    technical: number;
    communication: number;
    problemSolving: number;
    experience: number;
};

const DEFAULT_WEIGHTS: ScoringWeights = {
    technical: 40,
    problemSolving: 30,
    experience: 20,
    communication: 10
};

const weightKeys: { key: keyof ScoringWeights, label: string, icon: any, color: string }[] = [
    { key: "technical", label: "Technical Skills", icon: Code2, color: "from-blue-500 to-indigo-500" },
    { key: "problemSolving", label: "Problem Solving", icon: Brain, color: "from-purple-500 to-fuchsia-500" },
    { key: "experience", label: "Relevant Experience", icon: Briefcase, color: "from-emerald-500 to-teal-500" },
    { key: "communication", label: "Communication", icon: MessageSquare, color: "from-amber-500 to-orange-500" },
];

export default function AIInterviewConfig"""

if "const FormSection =" not in text:
    new_text = text.replace("export default function AIInterviewConfig", missing_code)
    with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
        f.write(new_text)
    print("Patched constants!")
else:
    print("Already there!")
