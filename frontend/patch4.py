import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# Remove the duplicates we added
code_to_remove = """type ScoringWeights = {
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
];"""

new_text = text.replace(code_to_remove, "")

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(new_text)

print("Duplicates removed!")
