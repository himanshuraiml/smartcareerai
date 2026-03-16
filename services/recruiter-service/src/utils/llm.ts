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
            logger.info('Groq API initialized in recruiter-service for candidate evaluation');
        } else {
            logger.warn('GROQ_API_KEY not found - candidate evaluation will use fallback');
        }
        initialized = true;
    }
    return groq;
}

function cleanJsonResponse(text: string): string {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.trim();
    return cleaned;
}

// ============================================================
// F12: VERTICAL-SPECIFIC JD GENERATION PROMPTS
// ============================================================

export const VERTICAL_PROMPTS: Record<string, { systemContext: string; certifications: string[]; seoKeywords: string[] }> = {
    Tech: {
        systemContext: 'Focus on engineering excellence, system design, cloud infrastructure, and agile methodologies. Mention relevant tech stacks, CI/CD, code review culture, and engineering growth paths.',
        certifications: ['AWS Solutions Architect', 'Google Cloud Professional', 'Kubernetes Administrator (CKA)', 'Certified Scrum Master', 'Microsoft Azure Fundamentals'],
        seoKeywords: ['full-stack', 'microservices', 'DevOps', 'API design', 'cloud-native', 'agile sprint', 'code review'],
    },
    Finance: {
        systemContext: 'Emphasize financial modeling, regulatory compliance (SEBI, RBI), risk management, and quantitative analysis. Mention relevant accounting standards, ERP systems, and fintech expertise.',
        certifications: ['CA / CPA', 'CFA Level I/II/III', 'FRM', 'CMA', 'ACCA', 'Bloomberg Market Concepts'],
        seoKeywords: ['financial modeling', 'risk management', 'regulatory compliance', 'IFRS', 'treasury', 'investment analysis'],
    },
    Ops: {
        systemContext: 'Highlight supply chain optimization, lean manufacturing, process improvement (Six Sigma), logistics, and vendor management. Include KPIs relevant to operational efficiency.',
        certifications: ['Six Sigma Green/Black Belt', 'PMP', 'APICS CPIM', 'Lean Manufacturing Certification', 'ISO 9001 Lead Auditor'],
        seoKeywords: ['supply chain', 'process optimization', 'lean six sigma', 'vendor management', 'logistics', 'SLA management'],
    },
    Sales: {
        systemContext: 'Focus on revenue targets, quota attainment, CRM proficiency, pipeline management, and consultative selling. Emphasize hunter vs. farmer profiles and enterprise account management.',
        certifications: ['Salesforce Certified Sales Cloud Consultant', 'HubSpot Sales Certification', 'Challenger Sales', 'SPIN Selling'],
        seoKeywords: ['quota attainment', 'pipeline management', 'CRM', 'enterprise sales', 'account management', 'revenue growth'],
    },
    Healthcare: {
        systemContext: 'Address clinical knowledge, patient care standards, regulatory compliance (CDSCO, HIPAA), healthcare IT systems, and interdisciplinary collaboration.',
        certifications: ['MBBS / BDS / Nursing License', 'ACLS / BLS', 'HL7 FHIR Certification', 'Clinical Research Associate (CRA)', 'Hospital Administration Diploma'],
        seoKeywords: ['patient care', 'clinical excellence', 'healthcare compliance', 'EMR/EHR', 'HIPAA', 'clinical trials'],
    },
    Manufacturing: {
        systemContext: 'Emphasize production planning, quality control, EHS (Environment Health Safety), equipment maintenance, and Industry 4.0 automation technologies.',
        certifications: ['Six Sigma Black Belt', 'Certified Maintenance & Reliability Technician (CMRT)', 'ISO 14001 EMS', 'OSHA 30-Hour', 'AutoCAD / SolidWorks'],
        seoKeywords: ['production planning', 'quality control', 'EHS compliance', 'Industry 4.0', 'OEE optimization', 'lean manufacturing'],
    },
};

export async function generateJDForVertical(
    title: string,
    keywords: string[],
    vertical: string,
): Promise<{ description: string; requiredSkills: string[]; recommendedCertifications: string[] }> {
    const client = getGroq();
    const verticalConfig = VERTICAL_PROMPTS[vertical];

    const fallback = {
        description: `Professional job description for ${title}. Required skills: ${keywords.join(', ')}.`,
        requiredSkills: keywords,
        recommendedCertifications: verticalConfig?.certifications.slice(0, 3) ?? [],
    };

    if (!client || !verticalConfig) return fallback;

    const prompt = `You are an expert ${vertical} industry recruiter. Generate a compelling, SEO-optimised job description for a "${title}" role.

Industry Context: ${verticalConfig.systemContext}
Input Keywords: ${keywords.join(', ')}
SEO Keywords to incorporate naturally: ${verticalConfig.seoKeywords.join(', ')}

Return JSON ONLY:
{
  "description": "Full markdown job description with sections: About the Role, Key Responsibilities (5-7 bullets), Requirements (5-7 bullets), Nice to Have (2-3 bullets), What We Offer",
  "requiredSkills": ["skill1", "skill2"]
}`;

    try {
        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        return {
            description: parsed.description || fallback.description,
            requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : keywords,
            recommendedCertifications: verticalConfig.certifications.slice(0, 4),
        };
    } catch {
        return fallback;
    }
}

export async function inferGenderFromName(firstName: string): Promise<{ gender: 'M' | 'F' | 'UNKNOWN'; confidence: number }> {
    const client = getGroq();
    if (!client) return { gender: 'UNKNOWN', confidence: 0 };

    try {
        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [{
                role: 'user',
                content: `Based on the first name "${firstName}", infer the most likely gender. Return JSON only: {"gender": "M"|"F"|"UNKNOWN", "confidence": 0.0-1.0}. Respond UNKNOWN if the name is ambiguous or culturally neutral.`,
            }],
            temperature: 0.1,
            max_tokens: 100,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(text);
        return {
            gender: ['M', 'F', 'UNKNOWN'].includes(parsed.gender) ? parsed.gender : 'UNKNOWN',
            confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0)),
        };
    } catch {
        return { gender: 'UNKNOWN', confidence: 0 };
    }
}

export interface CandidateEvaluationResult {
    fitScore: number;
    dropoutRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    acceptanceLikelihood: number;
    candidateSummary: string;
    shortlistJustification: string;
}

export async function evaluateCandidateFit(
    jobDetails: { title: string; description: string; requirements: string[]; requiredSkills: string[]; location: string; },
    candidateDetails: { name: string; skills: string[]; },
): Promise<CandidateEvaluationResult> {
    const systemPrompt = `You are an expert AI recruiting assistant. Evaluate the candidate's fit for the job based on their skills and profile.
Return JSON ONLY:
{
  "fitScore": number (0-100),
  "dropoutRisk": "LOW" | "MEDIUM" | "HIGH" (based on typical retention for this profile match),
  "acceptanceLikelihood": number (0-100, estimated likelihood they would accept an offer),
  "candidateSummary": "2-3 sentence summary of the candidate's strengths and weaknesses for this role",
  "shortlistJustification": "Brief justification for why this candidate should or should not be shortlisted"
}`;

    const userPrompt = `Job Details:
Title: ${jobDetails.title}
Location: ${jobDetails.location}
Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements.join(', ')}
Required Skills: ${jobDetails.requiredSkills.join(', ')}

Candidate Details:
Name: ${candidateDetails.name}
Skills: ${candidateDetails.skills.join(', ')}

Evaluate the candidate and return ONLY the JSON object.`;

    const fallback: CandidateEvaluationResult = {
        fitScore: 70,
        dropoutRisk: 'LOW',
        acceptanceLikelihood: 70,
        candidateSummary: 'Candidate profile evaluated using fallback heuristics due to AI unavailability.',
        shortlistJustification: 'Candidate possesses some matching skills but requires further review.',
    };

    try {
        const client = getGroq();
        if (!client) return fallback;

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(cleanJsonResponse(text));

        return {
            fitScore: Math.min(100, Math.max(0, result.fitScore ?? fallback.fitScore)),
            dropoutRisk: ['LOW', 'MEDIUM', 'HIGH'].includes(result.dropoutRisk) ? result.dropoutRisk : fallback.dropoutRisk,
            acceptanceLikelihood: Math.min(100, Math.max(0, result.acceptanceLikelihood ?? fallback.acceptanceLikelihood)),
            candidateSummary: result.candidateSummary || fallback.candidateSummary,
            shortlistJustification: result.shortlistJustification || fallback.shortlistJustification,
        };
    } catch (error) {
        logger.error('Failed to evaluate candidate fit:', error);
        return fallback;
    }
}

export interface CandidateComparisonResult {
    bestMatchId: string;
    comparisonSummary: string;
    candidateAssessments: Array<{ candidateId: string; score: number; pros: string[]; cons: string[] }>;
}

export async function compareCandidates(
    jobDetails: { title: string; description: string; requirements: string[]; requiredSkills: string[]; location: string; },
    candidatesList: Array<{ id: string; name: string; skills: string[]; profileScore?: number; }>,
): Promise<CandidateComparisonResult> {
    const systemPrompt = `You are an expert AI recruiting assistant. Compare the provided candidates against the job requirements and identify the best match.
Return JSON ONLY:
{
  "bestMatchId": "candidate_id_string",
  "comparisonSummary": "1 paragraph summary explaining why the best match was chosen over the others",
  "candidateAssessments": [
    {
       "candidateId": "candidate_id_string",
       "score": number (0-100, relative fit score),
       "pros": ["strength 1", "strength 2"],
       "cons": ["weakness 1", "weakness 2"]
    }
  ]
}`;

    const userPrompt = `Job Details:
Title: ${jobDetails.title}
Location: ${jobDetails.location}
Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements.join(', ')}
Required Skills: ${jobDetails.requiredSkills.join(', ')}

Candidates:
${JSON.stringify(candidatesList, null, 2)}

Compare the candidates, select the best match, and return ONLY the JSON object. Keep the pros and cons concise.`;

    const fallback: CandidateComparisonResult = {
        bestMatchId: candidatesList.length > 0 ? candidatesList[0].id : '',
        comparisonSummary: 'Comparison generated using fallback heuristics due to AI unavailability. The first candidate was selected by default.',
        candidateAssessments: candidatesList.map(c => ({
            candidateId: c.id,
            score: 70,
            pros: ['Matches some requirements'],
            cons: ['May lack specific experience'],
        })),
    };

    if (candidatesList.length === 0) {
        return { bestMatchId: '', comparisonSummary: 'No candidates provided.', candidateAssessments: [] };
    }

    try {
        const client = getGroq();
        if (!client) return fallback;

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(cleanJsonResponse(text));

        const isValidId = (id: string) => candidatesList.some(c => c.id === id);

        return {
            bestMatchId: isValidId(result.bestMatchId) ? result.bestMatchId : fallback.bestMatchId,
            comparisonSummary: result.comparisonSummary || fallback.comparisonSummary,
            candidateAssessments: Array.isArray(result.candidateAssessments) ? result.candidateAssessments : fallback.candidateAssessments,
        };
    } catch (error) {
        logger.error('Failed to compare candidates:', error);
        return fallback;
    }
}

export interface MessageClassification {
    category: 'URGENT' | 'TECHNICAL' | 'STATUS_QUERY' | 'GENERAL' | 'INQUIRY';
    autoResponse?: string;
    isHighValue: boolean;
    priority: number; // 0-10
}

export async function classifyMessage(
    messageContent: string,
    context?: { jobTitle?: string, applicationStatus?: string }
): Promise<MessageClassification> {
    const systemPrompt = `You are a recruitment assistant. Categorize the incoming candidate message.
Return JSON ONLY:
{
  "category": "URGENT" | "TECHNICAL" | "STATUS_QUERY" | "GENERAL" | "INQUIRY",
  "autoResponse": "Optional polite automated response if category is STATUS_QUERY or GENERAL",
  "isHighValue": boolean (true if it requires human recruiter attention),
  "priority": number (0-10, 10 being most urgent)
}

Rules:
- URGENT: Interview cancellation, link issues, multiple offer deadlines.
- TECHNICAL: Specific questions about tech stack, roles, or requirements.
- STATUS_QUERY: "Any update?", "When will I hear back?".
- INQUIRY: Questions about benefits, hybrid policy, company culture.
- GENERAL: "Thanks", "Received", "Looking forward".`;

    const userPrompt = `Message: "${messageContent}"
Context: Job: ${context?.jobTitle || 'N/A'}, Status: ${context?.applicationStatus || 'N/A'}`;

    const fallback: MessageClassification = {
        category: 'GENERAL',
        isHighValue: true,
        priority: 5
    };

    try {
        const client = getGroq();
        if (!client) return { ...fallback, category: 'GENERAL', priority: 1, isHighValue: true };

        const response = await client.chat.completions.create({
            model: AI_MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const text = response.choices[0]?.message?.content || '{}';
        const result = JSON.parse(cleanJsonResponse(text));

        return {
            category: result.category || fallback.category,
            autoResponse: result.autoResponse,
            isHighValue: result.isHighValue ?? true,
            priority: result.priority ?? 5
        };
    } catch (error) {
        logger.error('Failed to classify message:', error);
        return fallback;
    }
}
