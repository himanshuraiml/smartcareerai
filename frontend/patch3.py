import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# I also need to make sure the missing handleWeightSlider function and other properties exist
# They were originally inside the AIInterviewConfig component
missing_inner = """
    const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);

    const handleWeightSlider = (key: keyof ScoringWeights, value: number) => {
        setWeights(prev => {
            const sum = Object.values(prev).reduce((a, b) => a + b, 0) - prev[key];
            if (sum + value > 100) return { ...prev, [key]: 100 - sum };
            return { ...prev, [key]: value };
        });
    };
"""

if "handleWeightSlider =" not in text:
    new_text = text.replace("const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);", missing_inner)
    with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
        f.write(new_text)
    print("Patched handleWeightSlider!")
else:
    print("Already there!")
