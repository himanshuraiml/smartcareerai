import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { uploadBuffer, getPresignedUrl } from '../utils/minio';

const prisma = new PrismaClient();
const OFFERS_BUCKET = process.env.MINIO_OFFERS_BUCKET || 'offers';

export interface OfferLetterData {
    roleTitle: string;
    salaryAmount: number;
    salaryCurrency: string;
    startDate: string;
    customClauses?: string;
    benefits?: string[];
}

export class OfferLetterService {
    private async verifyAccess(applicationId: string, recruiterId: string) {
        const application = await prisma.recruiterJobApplicant.findFirst({
            where: { id: applicationId, job: { recruiterId } },
            include: {
                candidate: { select: { name: true, email: true } },
                job: { select: { title: true } },
            },
        });
        if (!application) throw createError('Application not found or access denied', 404);
        return application;
    }

    private buildPdf(
        data: OfferLetterData,
        candidateName: string,
        jobTitle: string,
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 60 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const formatSalary = (amount: number, currency: string) => {
                if (currency === 'INR') {
                    return `₹${(amount / 100000).toFixed(2)} LPA`;
                }
                return `${currency} ${amount.toLocaleString()}`;
            };

            const today = new Date().toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
            });

            // Header
            doc
                .fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#2563EB')
                .text('PlaceNxt', { align: 'center' })
                .moveDown(0.3)
                .fontSize(12)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('AI-Powered Career Platform', { align: 'center' })
                .moveDown(1.5);

            // Divider
            doc
                .moveTo(60, doc.y)
                .lineTo(doc.page.width - 60, doc.y)
                .strokeColor('#E5E7EB')
                .stroke()
                .moveDown(1);

            // Date
            doc
                .fontSize(11)
                .fillColor('#374151')
                .text(`Date: ${today}`, { align: 'right' })
                .moveDown(1);

            // Title
            doc
                .fontSize(18)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('OFFER LETTER', { align: 'center' })
                .moveDown(1.5);

            // Greeting
            doc
                .fontSize(12)
                .font('Helvetica')
                .fillColor('#374151')
                .text(`Dear ${candidateName},`)
                .moveDown(0.8)
                .text(
                    `We are delighted to offer you the position of ${data.roleTitle} at PlaceNxt. After careful consideration, we believe you will be a tremendous asset to our team.`,
                    { lineGap: 4 },
                )
                .moveDown(1.2);

            // Offer Details table
            doc
                .fontSize(13)
                .font('Helvetica-Bold')
                .fillColor('#2563EB')
                .text('Offer Details')
                .moveDown(0.6);

            const details: [string, string][] = [
                ['Position', data.roleTitle],
                ['Start Date', new Date(data.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Compensation', formatSalary(data.salaryAmount, data.salaryCurrency)],
            ];

            doc.font('Helvetica').fontSize(11).fillColor('#374151');
            for (const [label, value] of details) {
                doc
                    .font('Helvetica-Bold')
                    .text(`${label}: `, { continued: true })
                    .font('Helvetica')
                    .text(value)
                    .moveDown(0.4);
            }
            doc.moveDown(0.8);

            // Benefits
            const benefits = data.benefits?.filter(Boolean) || [
                'Health Insurance',
                'Professional Development Budget',
                'Flexible Work Policy',
            ];
            doc
                .fontSize(13)
                .font('Helvetica-Bold')
                .fillColor('#2563EB')
                .text('Benefits & Perks')
                .moveDown(0.5)
                .font('Helvetica')
                .fontSize(11)
                .fillColor('#374151');

            for (const benefit of benefits) {
                doc.text(`  • ${benefit}`, { lineGap: 3 });
            }
            doc.moveDown(1.2);

            // Custom clauses
            if (data.customClauses?.trim()) {
                doc
                    .fontSize(13)
                    .font('Helvetica-Bold')
                    .fillColor('#2563EB')
                    .text('Additional Terms')
                    .moveDown(0.5)
                    .font('Helvetica')
                    .fontSize(11)
                    .fillColor('#374151')
                    .text(data.customClauses.trim(), { lineGap: 4 })
                    .moveDown(1.2);
            }

            // Closing
            doc
                .fontSize(12)
                .font('Helvetica')
                .fillColor('#374151')
                .text(
                    'Please confirm your acceptance of this offer by signing and returning this letter within 5 business days. We look forward to welcoming you to the PlaceNxt team!',
                    { lineGap: 4 },
                )
                .moveDown(2);

            // Signature block
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Sincerely,')
                .moveDown(0.3)
                .text('PlaceNxt Talent Acquisition')
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('talent@placenxt.com')
                .moveDown(2);

            // Acceptance
            doc
                .moveTo(60, doc.y)
                .lineTo(doc.page.width - 60, doc.y)
                .strokeColor('#E5E7EB')
                .stroke()
                .moveDown(1)
                .fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('Candidate Acceptance')
                .moveDown(1)
                .font('Helvetica')
                .fillColor('#374151')
                .text(`I, ${candidateName}, accept the offer for the position of ${data.roleTitle}.`)
                .moveDown(1.5)
                .text('Signature: ______________________________')
                .moveDown(0.6)
                .text('Date: ______________________________');

            doc.end();
        });
    }

    async generateAndStore(
        applicationId: string,
        recruiterId: string,
        data: OfferLetterData,
    ): Promise<string> {
        const application = await this.verifyAccess(applicationId, recruiterId);
        const candidateName = application.candidate.name || 'Candidate';
        const jobTitle = data.roleTitle || application.job.title;

        logger.info(`Generating offer letter PDF for application ${applicationId}`);
        const pdfBuffer = await this.buildPdf(data, candidateName, jobTitle);

        const key = `offers/${applicationId}.pdf`;
        await uploadBuffer(OFFERS_BUCKET, key, pdfBuffer, 'application/pdf');

        await prisma.recruiterJobApplicant.update({
            where: { id: applicationId },
            data: {
                offerLetterUrl: key,
                offerLetterGeneratedAt: new Date(),
            },
        });

        const url = await getPresignedUrl(OFFERS_BUCKET, key, 3600);
        logger.info(`Offer letter generated for application ${applicationId}`);
        return url;
    }

    async getDownloadUrl(applicationId: string, recruiterId: string): Promise<string | null> {
        const application = await this.verifyAccess(applicationId, recruiterId);
        if (!application.offerLetterUrl) return null;
        return getPresignedUrl(OFFERS_BUCKET, application.offerLetterUrl, 3600);
    }
}

export const offerLetterService = new OfferLetterService();
