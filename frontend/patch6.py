import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

text = text.replace("q.textText", "q.questionText")
text = text.replace("q.text", "q.questionText")
text = text.replace("{q.tags?.[0] || 'General'}", "{q.type || 'General'}")
text = text.replace("~{q.durationMinutes || 2} min", "2 min")
text = text.replace("q.idealAnswer", "q.expectedKeyPoints?.join(', ') || ''")
text = text.replace("config.questions.map", "(config.questions || []).map")

# There might be an issue where handleWeightSlider goes missing from earlier
missing_inner = """
    const handleWeightSlider = (key: keyof ScoringWeights, value: number) => {
        setWeights(prev => {
            const sum = Object.values(prev).reduce((a, b) => a + b, 0) - prev[key];
            if (sum + value > 100) return { ...prev, [key]: 100 - sum };
            return { ...prev, [key]: value };
        });
    };
"""

if "handleWeightSlider =" not in text:
    text = text.replace("const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);", "const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);\n" + missing_inner)


with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(text)

print("Patched typescript errors!")
