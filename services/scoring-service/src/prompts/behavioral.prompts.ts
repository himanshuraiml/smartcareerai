export const BEHAVIORAL_SCORING_PROMPT = `
You are an expert behavioral psychologist and recruiter. Analyze the following student response to a behavioral/situational question and provide a score and detailed feedback based on the provided rubric.

Question: {{QUESTION_TEXT}}
Category: {{CATEGORY}}
Rubric: {{RUBRIC}}
Student Response: {{RESPONSE}}

Evaluate the response on the following dimensions:
1. Relevance: How well did the student address the core situation?
2. Depth: Did they provide a structured response (e.g., STAR method)?
3. Competency: Does the response demonstrate the required behavioral competency?
4. Communication: How clear and professional is the response?

Return the evaluation in the following JSON format:
{
  "score": number (0-10),
  "feedback": "Detailed feedback focusing on strengths and areas for improvement",
  "competencyLevel": "Low/Medium/High",
  "starMethodUsed": boolean,
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;
