export const ATS_SCORING_PROMPT = `
Analyze the following resume for ATS (Applicant Tracking System) compatibility for the role of {{JOB_ROLE}}.

RESUME TEXT:
{{RESUME_TEXT}}

JOB DESCRIPTION:
{{JOB_DESCRIPTION}}

ROLE REQUIREMENTS:
{{ROLE_CONTEXT}}

Provide a comprehensive ATS analysis in JSON format with the following structure:
{
  "overallScore": <number 0-100>,
  "keywordMatchPercent": <number 0-100>,
  "formattingScore": <number 0-100>,
  "experienceScore": <number 0-100>,
  "educationScore": <number 0-100>,
  "matchedKeywords": ["list of keywords found in resume that match the role"],
  "missingKeywords": ["list of important keywords missing from the resume"],
  "formattingIssues": ["list of formatting issues that could affect ATS parsing"],
  "suggestions": ["list of actionable improvements to boost ATS score"],
  "scoreDeductions": [
    {"category": "Keywords", "points": <number deducted>, "reason": "specific reason for deduction"},
    {"category": "Formatting", "points": <number deducted>, "reason": "specific reason"},
    {"category": "Experience", "points": <number deducted>, "reason": "specific reason"},
    {"category": "Education", "points": <number deducted>, "reason": "specific reason"}
  ],
  "scoreExplanation": "A 2-3 sentence plain-English summary of WHY the overall score is what it is. Be specific about the biggest factors.",
  "industryBenchmark": {
    "estimatedPercentile": <number 0-100, where the candidate roughly falls compared to typical applicants for this role>,
    "averageScoreForRole": <number 0-100, the typical ATS score for this role>,
    "competitiveLevel": "below_average | average | above_average | excellent"
  },
  "transparencyNote": "A brief note explaining that ATS scores vary across platforms (LinkedIn, Indeed, Workday, etc.) because each uses different keyword weighting and parsing algorithms. Our score focuses on keyword relevance, formatting compliance, and content depth.",
  "biasFlags": ["list of potential biases detected in the resume text, such as gendered language, age indicators, socioeconomic hints, or racial indicators. Empty array if none found."]
}

Scoring Guidelines:
- overallScore: Weighted average considering keyword match (40%), formatting (20%), experience (25%), education (15%)
- keywordMatchPercent: Percentage of required skills/keywords found
- formattingScore: Check for proper sections, consistent formatting, no tables/graphics issues
- experienceScore: Relevance and depth of work experience to the role
- educationScore: Relevance of education, certifications, and qualifications
- scoreDeductions: For EACH category, list exactly how many points were lost and why. Start from 100 for each category and deduct.
- scoreExplanation: Summarize in plain English why the candidate got this score. Mention the top 2-3 factors.
- industryBenchmark: Estimate where this resume stands compared to typical applicants. Be realistic.
- biasFlags: Flag any language or details that might unconsciously bias a human recruiter (e.g. fraternity/sorority names, graduation years revealing age, gendered names/pronouns if prominent). These should NOT affect the score, but act as a warning.

Be specific in your analysis and provide actionable feedback.
`;

export const KEYWORD_EXTRACTION_PROMPT = `
Extract all relevant skills, technologies, and keywords from the following resume text.
Categorize them into: Technical Skills, Soft Skills, Tools, Certifications, and Other.

RESUME TEXT:
{{RESUME_TEXT}}

Return in JSON format:
{
  "technicalSkills": ["list of technical skills"],
  "softSkills": ["list of soft skills"],
  "tools": ["list of tools and platforms"],
  "certifications": ["list of certifications"],
  "other": ["other relevant keywords"]
}
`;

export const FORMAT_ANALYSIS_PROMPT = `
Analyze the following resume for formatting issues that could affect ATS parsing.

RESUME TEXT:
{{RESUME_TEXT}}

Check for:
1. Contact information presence and format
2. Section headers (Experience, Education, Skills)
3. Consistent date formats
4. Bullet points and structure
5. Length appropriateness
6. Any characters or formatting that might confuse ATS systems

Return in JSON format:
{
  "hasContactInfo": boolean,
  "hasProperSections": boolean,
  "formattingIssues": ["list of specific issues"],
  "recommendations": ["list of formatting recommendations"]
}
`;
