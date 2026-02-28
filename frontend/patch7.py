import re

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'r') as f:
    text = f.read()

# Fix the {q.expectedKeyPoints?.join(', ') || '' && ( 
text = text.replace("{q.expectedKeyPoints?.join(', ') || '' && (", "{q.expectedKeyPoints && q.expectedKeyPoints.length > 0 && (")

# Re-add weightKeys but using the new CRITERIA_META we discovered in the file
text = text.replace("weightKeys.map", "CRITERIA_META.map")

with open('/Users/himanshurai/project/placeNxt/smartcareerai/frontend/src/components/recruiter/AIInterviewConfig.tsx', 'w') as f:
    f.write(text)

print("Patched weightKeys to CRITERIA_META!")
