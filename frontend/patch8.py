import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# Replace icon: Icon with gradient to use the existing data from CRITERIA_META
text = text.replace("CRITERIA_META.map(({ key, label, icon: Icon, color })", "CRITERIA_META.map(({ key, label, gradient })")

# The Icon tag needs to be replaced. Looking at the code: <Icon className="w-5 h-5 text-white" />
text = text.replace("<Icon className=", "<Brain className=")

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(text)

print("Patched icon!")
