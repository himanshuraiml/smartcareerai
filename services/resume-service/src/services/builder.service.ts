import { optimizeResumeSection, generateBulletPoints, tailorResumeToJob } from '../utils/ai';
import { logger } from '../utils/logger';

export class BuilderService {
    async getTemplates() {
        // Return static list of available templates
        return [
            {
                id: 'modern',
                name: 'Modern Professional',
                description: 'Clean, ATS-friendly design for experienced professionals.',
                thumbnail: '/templates/modern-preview.png', // Frontend will map this
                category: 'Experienced',
            },
            {
                id: 'student',
                name: 'Academic Focus',
                description: 'Highlights education and projects for students/new grads.',
                thumbnail: '/templates/student-preview.png',
                category: 'Student',
            },
            {
                id: 'creative',
                name: 'Creative Portfolio',
                description: 'Visual layout for designers and creative roles.',
                thumbnail: '/templates/creative-preview.png',
                category: 'Creative',
            },
            {
                id: 'minimal',
                name: 'Minimalist',
                description: 'Simple, distraction-free layout focusing on content.',
                thumbnail: '/templates/minimal-preview.png',
                category: 'General',
            },
        ];
    }

    async optimizeResumeContent(
        sectionType: 'summary' | 'experience' | 'skills' | 'education',
        content: string,
        targetRole: string
    ) {
        try {
            return await optimizeResumeSection(sectionType, content, targetRole);
        } catch (error) {
            logger.error('Error optimizing resume content:', error);
            throw error;
        }
    }

    async generateBullets(
        role: string,
        responsibilities: string
    ) {
        try {
            return await generateBulletPoints(role, responsibilities);
        } catch (error) {
            logger.error('Error generating bullet points:', error);
            throw error;
        }
    }

    async tailorResume(
        resumeContent: string,
        jobDescription: string
    ) {
        try {
            return await tailorResumeToJob(resumeContent, jobDescription);
        } catch (error) {
            logger.error('Error tailoring resume:', error);
            throw error;
        }
    }
}
