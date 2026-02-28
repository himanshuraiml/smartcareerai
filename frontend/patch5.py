import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# Fix the enum mismatch
text = text.replace('{ value: "HR_SCREENING", label: "HR Screening"', '{ value: "HR", label: "HR Screening"')

# Remove the handleWeightSlider we added
text = text.replace("""    const handleWeightSlider = (key: keyof ScoringWeights, value: number) => {
        setWeights(prev => {
            const sum = Object.values(prev).reduce((a, b) => a + b, 0) - prev[key];
            if (sum + value > 100) return { ...prev, [key]: 100 - sum };
            return { ...prev, [key]: value };
        });
    };""", "")

# Fix config.questions typing/properties
text = text.replace("q.question", "q.text")
text = text.replace("q.expectation", "q.idealAnswer")
text = text.replace("{q.category}", "{q.tags?.[0] || 'General'}")
text = text.replace("~{q.suggestedTimeMintues} min", "~{q.durationMinutes || 2} min")


with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(text)

print("Patched types!")
