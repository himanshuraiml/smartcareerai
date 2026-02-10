import Groq from 'groq-sdk';
import { logger } from './logger';

const AI_MODEL_NAME = process.env.AI_MODEL_NAME || 'llama-3.3-70b-versatile';

let groq: Groq | null = null;
let initialized = false;

function getGroq(): Groq | null {
    if (!initialized) {
        const apiKey = process.env.GROQ_API_KEY;
        if (apiKey) {
            groq = new Groq({ apiKey });
            logger.info('Groq API initialized for resume builder');
        } else {
            logger.warn('GROQ_API_KEY not found - resume builder will use fallback/mock responses');
        }
        initialized = true;
    }
    return groq;
}

export async function optimizeResumeSection(
    sectionType: 'summary' | 'experience' | 'skills' | 'education',
    content: string,
    targetRole: string
): Promise<string> {
    const systemPrompt = `You are an expert resume writer and career coach specializing in ATS optimization.
Your goal is to rewrite the provided resume section to be more impactful, professional, and tailored for a ${targetRole} role.
Do not invent facts, but improve clarity, use strong action verbs, and highlight achievements.
Return ONLY the rewritten content as a string. Do not include introductory text or markdown formatting like detailed explanations.`;

    const userPrompt = `Rewrite the following ${sectionType} section for a ${targetRole} position:

"${content}"

Ensure it is concise, professional, and uses industry-standard keywords.`;

    try {
        const client = getGroq();
        if (!client) {
            return content; // Fallback: return original if no AI
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1024,
        });

        return response.choices[0]?.message?.content || content;
    } catch (error) {
        logger.error('Failed to optimize resume section:', error);
        return content;
    }
}

export async function generateBulletPoints(
    role: string,
    responsibilities: string
): Promise<string[]> {
    const systemPrompt = `You are an expert resume writer. Generate 3-5 professional, achievement-oriented bullet points for a ${role} position based on the provided responsibilities.
Each bullet point should start with a strong action verb and ideally include a metric or outcome.
Return a JSON array of strings: ["bullet 1", "bullet 2", ...].`;

    const userPrompt = `Responsibilities/Context: "${responsibilities}"

Generate optimized bullet points.`;

    try {
        const client = getGroq();
        if (!client) {
            return [responsibilities]; // Fallback
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '[]';
        const parsed = JSON.parse(text);
        return Array.isArray(parsed.bullets) ? parsed.bullets : (Array.isArray(parsed) ? parsed : [responsibilities]);
    } catch (error) {
        logger.error('Failed to generate bullet points:', error);
        return [responsibilities];
    }
}

export async function tailorResumeToJob(
    resumeContent: string,
    jobDescription: string
): Promise<{ tailoredContent: string; changes: string[] }> {
    const systemPrompt = `You are an ATS expert. Tailor the resume content to better match the job description.
Identify keywords from the JD and naturally incorporate them into the resume where applicable.
Return JSON: { "tailoredContent": "full rewritten text", "changes": ["added keyword X", "rephrased Y"] }`;

    const userPrompt = `Resume Content: "${resumeContent}"

Job Description: "${jobDescription}"

Tailor the resume.`;

    try {
        const client = getGroq();
        if (!client) {
            return { tailoredContent: resumeContent, changes: [] };
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 2048,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        return JSON.parse(text);
    } catch (error) {
        logger.error('Failed to tailor resume:', error);
        return { tailoredContent: resumeContent, changes: [] };
    }
}

export async function parseResumeContent(resumeText: string): Promise<any> {
    // Truncate text to avoid token limits (approx 20k chars is safe for most models)
    const truncatedText = resumeText.slice(0, 20000);

    const systemPrompt = `You are an intelligent resume parser. Extract structured data from the provided resume text.
    Return a valid JSON object with the following structure:
    {
        "personalInfo": {
            "name": "Full Name",
            "email": "Email Address",
            "phone": "Phone Number",
            "links": ["linkedin.com/in/...", "github.com/..."],
            "portfolio": "Portfolio URL or Website"
        },
        "professionalSummary": "Summary text...",
        "experience": [
            {
                "id": "exp-1", 
                "company": "Company Name",
                "role": "Job Title",
                "startDate": "Start Date",
                "endDate": "End Date or Present",
                "current": boolean,
                "description": "Description of responsibilities"
            }
        ],
        "education": [
             {
                "id": "edu-1",
                "school": "School Name",
                "degree": "Degree",
                "field": "Field of Study",
                "startDate": "Start Year",
                "endDate": "End Year",
                "grade": "GPA or Grade"
            }
        ],
        "skills": ["Skill 1", "Skill 2", ...],
        "internships": [
            {
                "company": "Company Name",
                "role": "Role",
                "startDate": "Start Date",
                "endDate": "End Date",
                "description": "Description"
            }
        ],
        "projects": [
             {
                "title": "Project Title",
                "description": "Project Description",
                "technologies": ["Tech 1", "Tech 2"],
                "link": "Project Link"
            }
        ],
        "certifications": [
            {
                "name": "Course/Certificate Name",
                "issuer": "Platform/Organization",
                "date": "Completion Date",
                "link": "Certificate URL"
            }
        ],
        "industrialTraining": [
            {
                "organization": "Org Name",
                "project": "Project/Subject",
                "startDate": "Start Date",
                "endDate": "End Date",
                "description": "Details"
            }
        ],
        "publications": [
            {
                "title": "Title",
                "publisher": "Journal/Conference",
                "date": "Date",
                "link": "Link"
            }
        ],
        "awards": [
             {
                 "title": "Award Title",
                 "date": "Date",
                 "issuer": "Issuer"
             }
        ],
        "coCurricular": ["Activity 1", "Activity 2"],
        "industrialVisits": [
             {
                 "company": "Company Name",
                 "date": "Date",
                 "description": "Learnings"
             }
        ],
        "hobbies": ["Hobby 1", "Hobby 2"]
    }
    If a field is not found, return empty strings or empty arrays. Ensure the JSON is valid.`;

    try {
        const client = getGroq();
        if (!client) {
            logger.warn('Groq client not available, using regex fallback');
            return basicRegexParse(resumeText);
        }

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: truncatedText },
            ],
            temperature: 0.1, // Lower temperature for extraction
            max_tokens: 2048,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';

        try {
            const parsed = JSON.parse(text);
            // Basic validation
            if (!parsed.personalInfo) {
                logger.warn('AI returned JSON but missing personalInfo, falling back to regex merge');
                const basic = basicRegexParse(resumeText);
                return { ...parsed, personalInfo: { ...basic.personalInfo, ...parsed.personalInfo } };
            }
            return parsed;
        } catch (e) {
            logger.error('Failed to parse AI JSON response', { text });
            return basicRegexParse(resumeText);
        }
    } catch (error) {
        logger.error('Failed to parse resume content with AI:', error);
        return basicRegexParse(resumeText);
    }
}

function basicRegexParse(text: string) {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const phoneRegex = /(\+?[\d\s-]{10,})/;
    const linkRegex = /(https?:\/\/[^\s]+)/g;

    const email = text.match(emailRegex)?.[0] || '';
    const phone = text.match(phoneRegex)?.[0] || '';
    const links = Array.from(text.matchAll(linkRegex)).map(m => m[0]);

    return {
        personalInfo: {
            name: '', // Hard to regex name reliably without NLP
            email,
            phone,
            links
        },
        professionalSummary: '',
        experience: [],
        education: [],
        skills: []
    };
}
