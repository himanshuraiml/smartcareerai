import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { analyzeWithGemini } from '../utils/gemini';

export class SkillService {
    // Get all available job roles for registration/personalization
    async getJobRoles() {
        return prisma.jobRole.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                category: true,
            },
            orderBy: [{ category: 'asc' }, { title: 'asc' }],
        });
    }

    // Get all skills with optional filtering
    async getAllSkills(category?: string, search?: string) {
        const where: any = { isActive: true };

        if (category) {
            where.category = category;
        }

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        return prisma.skill.findMany({
            where,
            orderBy: { demandScore: 'desc' },
        });
    }

    // Get skill by ID
    async getSkillById(skillId: string) {
        const skill = await prisma.skill.findUnique({
            where: { id: skillId },
            include: { courses: { where: { isActive: true }, take: 5 } },
        });

        if (!skill) {
            throw new AppError('Skill not found', 404);
        }

        return skill;
    }

    // Analyze resume to extract skills using LLM
    async analyzeResumeSkills(userId: string, resumeId: string) {
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId, isActive: true },
        });

        if (!resume || !resume.parsedText) {
            throw new AppError('Resume not found or not parsed', 404);
        }

        // Get all available skills for matching
        const allSkills = await prisma.skill.findMany({ where: { isActive: true } });
        const skillNames = allSkills.map(s => s.name);

        // Use LLM to extract skills from resume
        const prompt = `Analyze the following resume text and extract all technical and soft skills.
    
Available skills to match against: ${skillNames.join(', ')}

Resume text:
${resume.parsedText}

Return a JSON object with:
{
  "extractedSkills": [
    { "name": "skill name", "proficiency": "beginner|intermediate|advanced|expert", "confidence": 0.0-1.0 }
  ],
  "suggestedSkills": ["skill names not in available list but found in resume"]
}`;

        try {
            const systemPrompt = 'You are an expert skills analyzer. Extract skills from resumes accurately. Return JSON only.';
            const analysis = await analyzeWithGemini(systemPrompt, prompt);

            // Save extracted skills to user profile
            const savedSkills = [];
            for (const extracted of analysis.extractedSkills || []) {
                const matchedSkill = allSkills.find(
                    s => s.name.toLowerCase() === extracted.name.toLowerCase()
                );

                if (matchedSkill && extracted.confidence >= 0.7) {
                    const userSkill = await prisma.userSkill.upsert({
                        where: {
                            userId_skillId: { userId, skillId: matchedSkill.id },
                        },
                        create: {
                            userId,
                            skillId: matchedSkill.id,
                            proficiencyLevel: extracted.proficiency,
                            source: 'resume',
                        },
                        update: {
                            proficiencyLevel: extracted.proficiency,
                        },
                        include: { skill: true },
                    });
                    savedSkills.push(userSkill);
                }
            }

            logger.info(`Extracted ${savedSkills.length} skills for user ${userId}`);

            return {
                extractedSkills: savedSkills,
                suggestedSkills: analysis.suggestedSkills || [],
                totalFound: analysis.extractedSkills?.length || 0,
            };
        } catch (error) {
            logger.error('Failed to analyze resume skills', error);
            throw new AppError('Failed to analyze skills', 500);
        }
    }

    // Get user's skills
    async getUserSkills(userId: string) {
        return prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Add a skill to user profile
    async addUserSkill(
        userId: string,
        skillId: string,
        proficiencyLevel: string,
        source: string
    ) {
        const skill = await prisma.skill.findUnique({ where: { id: skillId } });
        if (!skill) {
            throw new AppError('Skill not found', 404);
        }

        return prisma.userSkill.upsert({
            where: {
                userId_skillId: { userId, skillId },
            },
            create: {
                userId,
                skillId,
                proficiencyLevel,
                source,
            },
            update: {
                proficiencyLevel,
                source,
            },
            include: { skill: true },
        });
    }

    // Remove skill from user profile
    async removeUserSkill(userId: string, skillId: string) {
        await prisma.userSkill.deleteMany({
            where: { userId, skillId },
        });
    }

    // Gap analysis - compare user skills to target role requirements
    async getGapAnalysis(userId: string, targetRole: string) {
        // Get user's current skills
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: { skill: true },
        });

        // Get target role requirements
        const jobRole = await prisma.jobRole.findFirst({
            where: { title: { contains: targetRole, mode: 'insensitive' } },
        });

        if (!jobRole) {
            throw new AppError('Target role not found', 404);
        }

        const userSkillNames = userSkills.map(us => us.skill.name.toLowerCase());
        const requiredSkills = jobRole.requiredSkills || [];
        const preferredSkills = jobRole.preferredSkills || [];

        // Calculate gaps
        const missingRequired = requiredSkills.filter(
            skill => !userSkillNames.includes(skill.toLowerCase())
        );

        const missingPreferred = preferredSkills.filter(
            skill => !userSkillNames.includes(skill.toLowerCase())
        );

        const matchedRequired = requiredSkills.filter(
            skill => userSkillNames.includes(skill.toLowerCase())
        );

        const matchedPreferred = preferredSkills.filter(
            skill => userSkillNames.includes(skill.toLowerCase())
        );

        // Calculate match percentage
        const totalRequired = requiredSkills.length || 1;
        const matchPercent = Math.round((matchedRequired.length / totalRequired) * 100);

        return {
            targetRole: jobRole.title,
            matchPercent,
            summary: {
                requiredMatch: `${matchedRequired.length}/${requiredSkills.length}`,
                preferredMatch: `${matchedPreferred.length}/${preferredSkills.length}`,
            },
            matchedSkills: {
                required: matchedRequired,
                preferred: matchedPreferred,
            },
            missingSkills: {
                required: missingRequired,
                preferred: missingPreferred,
            },
            userSkills: userSkills.map(us => ({
                name: us.skill.name,
                proficiency: us.proficiencyLevel,
                isVerified: us.isVerified,
            })),
        };
    }

    // Generate learning roadmap using LLM
    async generateRoadmap(userId: string, targetRole: string, weeks: number) {
        const gapAnalysis = await this.getGapAnalysis(userId, targetRole);

        if (gapAnalysis.missingSkills.required.length === 0) {
            return {
                message: 'You already have all required skills for this role!',
                roadmap: [],
            };
        }

        // Get courses for missing skills
        const allSkills = await prisma.skill.findMany({
            where: {
                name: { in: [...gapAnalysis.missingSkills.required, ...gapAnalysis.missingSkills.preferred] },
            },
            include: { courses: { where: { isActive: true } } },
        });

        const prompt = `Create a ${weeks}-week learning roadmap for someone who wants to become a ${targetRole}.

Current skills: ${gapAnalysis.userSkills.map(s => s.name).join(', ')}

Missing REQUIRED skills (high priority): ${gapAnalysis.missingSkills.required.join(', ')}
Missing PREFERRED skills (lower priority): ${gapAnalysis.missingSkills.preferred.join(', ')}

Available courses:
${allSkills.map(s => `${s.name}: ${s.courses.map(c => `${c.title} (${c.durationHours}h, ${c.difficulty})`).join(', ')}`).join('\n')}

Return a JSON object with:
{
  "roadmap": [
    {
      "week": 1,
      "focus": "main topic for the week",
      "skills": ["skill1", "skill2"],
      "tasks": ["specific task 1", "specific task 2"],
      "estimatedHours": 10
    }
  ],
  "totalHours": 120,
  "readinessScore": 85
}`;

        try {
            const systemPrompt = 'You are a career development expert. Create detailed learning roadmaps. Return JSON only.';
            const result = await analyzeWithGemini(systemPrompt, prompt);

            // If LLM failed, use fallback
            if (!result || !result.roadmap) {
                throw new Error('LLM returned invalid result');
            }

            return {
                targetRole,
                duration: `${weeks} weeks`,
                currentMatch: `${gapAnalysis.matchPercent}%`,
                ...result,
            };
        } catch (error) {
            logger.error('Failed to generate roadmap with LLM, using fallback', error);

            // Fallback: simple week-by-week skill assignment
            const allMissingSkills = [
                ...gapAnalysis.missingSkills.required,
                ...gapAnalysis.missingSkills.preferred.slice(0, 5)
            ];

            const skillsPerWeek = Math.max(1, Math.ceil(allMissingSkills.length / weeks));
            const roadmap = [];

            for (let week = 1; week <= Math.min(weeks, 12); week++) {
                const startIdx = (week - 1) * skillsPerWeek;
                const weekSkills = allMissingSkills.slice(startIdx, startIdx + skillsPerWeek);

                if (weekSkills.length > 0) {
                    const mainSkill = weekSkills[0];
                    roadmap.push({
                        week,
                        focus: `Master ${mainSkill}`,
                        skills: weekSkills,
                        tasks: [
                            `Study ${mainSkill} fundamentals and core concepts`,
                            `Complete hands-on tutorials and exercises`,
                            `Build a small project using ${mainSkill}`,
                            weekSkills.length > 1 ? `Explore ${weekSkills.slice(1).join(', ')}` : 'Review and practice',
                        ],
                        resources: this.getCourseResources(mainSkill),
                        estimatedHours: 8 + (weekSkills.length * 2),
                    });
                }
            }

            // If no missing skills, create a generic improvement roadmap
            if (roadmap.length === 0) {
                roadmap.push({
                    week: 1,
                    focus: `Advance your ${targetRole} skills`,
                    skills: ['Advanced Concepts', 'Best Practices'],
                    tasks: [
                        'Review industry best practices',
                        'Study advanced patterns and architectures',
                        'Contribute to open source projects',
                        'Build a portfolio project',
                    ],
                    estimatedHours: 15,
                });
            }

            return {
                targetRole,
                duration: `${weeks} weeks`,
                currentMatch: `${gapAnalysis.matchPercent}%`,
                roadmap,
                totalHours: roadmap.reduce((sum, w) => sum + w.estimatedHours, 0),
                readinessScore: gapAnalysis.matchPercent,
            };
        }
    }

    // Get course recommendations for user's missing skills
    async getCourseRecommendations(userId: string, skillId?: string, limit: number = 5) {
        if (skillId) {
            // Recommendations for specific skill
            return prisma.course.findMany({
                where: { skillId, isActive: true },
                include: { skill: true },
                orderBy: { rating: 'desc' },
                take: limit,
            });
        }

        // Get user skills to find gaps
        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            select: { skillId: true },
        });

        const userSkillIds = userSkills.map(us => us.skillId);

        // Get courses for skills user doesn't have
        const courses = await prisma.course.findMany({
            where: {
                skillId: { notIn: userSkillIds },
                isActive: true,
            },
            include: { skill: true },
            orderBy: [{ skill: { demandScore: 'desc' } }, { rating: 'desc' }],
            take: limit,
        });

        return courses;
    }

    // Get curated course resources for a skill
    private getCourseResources(skill: string): Array<{ name: string; platform: string; url: string; type: string }> {
        const skillLower = skill.toLowerCase();
        const searchTerm = encodeURIComponent(skill);

        // Skill-specific curated resources
        const curatedResources: Record<string, Array<{ name: string; platform: string; url: string; type: string }>> = {
            'javascript': [
                { name: 'JavaScript - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/javascript-the-complete-guide-2020-beginner-advanced/', type: 'Course' },
                { name: 'JavaScript Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', type: 'Video' },
                { name: 'Programming with JavaScript', platform: 'Coursera', url: 'https://www.coursera.org/learn/javascript', type: 'Course' },
            ],
            'python': [
                { name: 'Python for Everybody', platform: 'Coursera', url: 'https://www.coursera.org/specializations/python', type: 'Course' },
                { name: 'Python Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', type: 'Video' },
                { name: '100 Days of Code Python', platform: 'Udemy', url: 'https://www.udemy.com/course/100-days-of-code/', type: 'Course' },
            ],
            'react': [
                { name: 'React - The Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', type: 'Course' },
                { name: 'React Tutorial for Beginners', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', type: 'Video' },
                { name: 'Meta React Basics', platform: 'Coursera', url: 'https://www.coursera.org/learn/react-basics', type: 'Course' },
            ],
            'node.js': [
                { name: 'Node.js Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/nodejs-the-complete-guide/', type: 'Course' },
                { name: 'Node.js Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', type: 'Video' },
                { name: 'Server-side with Node.js', platform: 'Coursera', url: 'https://www.coursera.org/learn/server-side-nodejs', type: 'Course' },
            ],
            'sql': [
                { name: 'SQL for Data Science', platform: 'Coursera', url: 'https://www.coursera.org/learn/sql-for-data-science', type: 'Course' },
                { name: 'SQL Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', type: 'Video' },
                { name: 'Complete SQL Bootcamp', platform: 'Udemy', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', type: 'Course' },
            ],
            'docker': [
                { name: 'Docker & Kubernetes', platform: 'Udemy', url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', type: 'Course' },
                { name: 'Docker Tutorial', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', type: 'Video' },
                { name: 'Docker Essentials', platform: 'Coursera', url: 'https://www.coursera.org/learn/docker-essentials', type: 'Course' },
            ],
            'aws': [
                { name: 'AWS Certified Solutions Architect', platform: 'Udemy', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', type: 'Course' },
                { name: 'AWS Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', type: 'Video' },
                { name: 'AWS Fundamentals', platform: 'Coursera', url: 'https://www.coursera.org/specializations/aws-fundamentals', type: 'Course' },
            ],
            'machine learning': [
                { name: 'Machine Learning by Andrew Ng', platform: 'Coursera', url: 'https://www.coursera.org/learn/machine-learning', type: 'Course' },
                { name: 'ML Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=Gv9_4yMHFhI', type: 'Video' },
                { name: 'Machine Learning A-Z', platform: 'Udemy', url: 'https://www.udemy.com/course/machinelearning/', type: 'Course' },
            ],
            'kubernetes': [
                { name: 'Kubernetes for Beginners', platform: 'Udemy', url: 'https://www.udemy.com/course/learn-kubernetes/', type: 'Course' },
                { name: 'Kubernetes Tutorial', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', type: 'Video' },
                { name: 'Google Cloud Kubernetes', platform: 'Coursera', url: 'https://www.coursera.org/learn/google-kubernetes-engine', type: 'Course' },
            ],
            'typescript': [
                { name: 'Understanding TypeScript', platform: 'Udemy', url: 'https://www.udemy.com/course/understanding-typescript/', type: 'Course' },
                { name: 'TypeScript Full Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', type: 'Video' },
                { name: 'TypeScript Documentation', platform: 'Docs', url: 'https://www.typescriptlang.org/docs/', type: 'Documentation' },
            ],
            'git': [
                { name: 'Git Complete Guide', platform: 'Udemy', url: 'https://www.udemy.com/course/git-complete/', type: 'Course' },
                { name: 'Git & GitHub Crash Course', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', type: 'Video' },
                { name: 'Version Control with Git', platform: 'Coursera', url: 'https://www.coursera.org/learn/version-control-with-git', type: 'Course' },
            ],
        };

        // Check if skill has curated resources
        for (const [key, resources] of Object.entries(curatedResources)) {
            if (skillLower.includes(key) || key.includes(skillLower)) {
                return resources;
            }
        }

        // Fallback: generate dynamic search URLs
        return [
            { name: `${skill} Course`, platform: 'Coursera', url: `https://www.coursera.org/search?query=${searchTerm}`, type: 'Search' },
            { name: `${skill} Tutorial`, platform: 'YouTube', url: `https://www.youtube.com/results?search_query=${searchTerm}+tutorial`, type: 'Search' },
            { name: `${skill} Complete Course`, platform: 'Udemy', url: `https://www.udemy.com/courses/search/?q=${searchTerm}`, type: 'Search' },
        ];
    }
}

