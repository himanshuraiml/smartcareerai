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
  "suggestions": ["list of actionable improvements to boost ATS score"]
}

Scoring Guidelines:
- overallScore: Weighted average considering keyword match (40%), formatting (20%), experience (25%), education (15%)
- keywordMatchPercent: Percentage of required skills/keywords found
- formattingScore: Check for proper sections, consistent formatting, no tables/graphics issues
- experienceScore: Relevance and depth of work experience to the role
- educationScore: Relevance of education, certifications, and qualifications

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
