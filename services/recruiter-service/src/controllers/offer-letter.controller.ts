import { Request, Response, NextFunction } from 'express';
import { offerLetterService } from '../services/offer-letter.service';

export class OfferLetterController {
    async generate(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: applicationId } = req.params;
            const recruiterId = req.recruiter!.id;
            const { roleTitle, salaryAmount, salaryCurrency, startDate, customClauses, benefits } = req.body;

            if (!salaryAmount || !salaryCurrency || !startDate) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'salaryAmount, salaryCurrency, and startDate are required' },
                });
            }

            const url = await offerLetterService.generateAndStore(applicationId, recruiterId, {
                roleTitle,
                salaryAmount: Number(salaryAmount),
                salaryCurrency,
                startDate,
                customClauses,
                benefits,
            });

            res.json({ success: true, data: { url } });
        } catch (err) {
            next(err);
        }
    }

    async download(req: Request, res: Response, next: NextFunction) {
        try {
            const url = await offerLetterService.getDownloadUrl(req.params.id, req.recruiter!.id);
            if (!url) {
                return res.status(404).json({ success: false, error: { message: 'No offer letter generated yet' } });
            }
            res.json({ success: true, data: { url } });
        } catch (err) {
            next(err);
        }
    }
}

export const offerLetterController = new OfferLetterController();
