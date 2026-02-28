import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# Replace color with gradient
text = text.replace("CRITERIA_META.map(({ key, label, gradient })", "CRITERIA_META.map(({ key, label, color, gradient })")

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(text)

print("Patched compiler error!")
