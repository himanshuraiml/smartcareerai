import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { generateAccreditationPdf } from '../utils/pdf-generator';
import { generateAccreditationExcel } from '../utils/excel-generator';
import { logger } from '../utils/logger';

export class ReportController {
    /**
     * Get NIRF Data
     */
    async getNirfData(req: Request, res: Response) {
        try {
            const { institutionId } = req.params;
            const { year } = req.query;
            const data = await reportService.getNirfData(institutionId, Number(year) || new Date().getFullYear());
            res.status(200).json(data);
        } catch (error: any) {
            logger.error(`Error fetching NIRF data: ${error.message}`);
            res.status(500).json({ error: 'Failed to fetch NIRF data' });
        }
    }

    /**
     * Export Accreditation Report (PDF or Excel)
     */
    async exportAccreditationReport(req: Request, res: Response) {
        try {
            const { institutionId } = req.params;
            const { year, format } = req.query;
            const data = await reportService.getNirfData(institutionId, Number(year) || new Date().getFullYear());

            if (format === 'pdf') {
                const pdfBuffer = await generateAccreditationPdf(data);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=Accreditation_Report_${year}.pdf`);
                return res.send(pdfBuffer);
            } else if (format === 'excel') {
                const excelBuffer = await generateAccreditationExcel(data);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=Accreditation_Report_${year}.xlsx`);
                return res.send(excelBuffer);
            } else {
                return res.status(400).json({ error: 'Invalid export format. Supported forms: pdf, excel' });
            }
        } catch (error: any) {
            logger.error(`Error exporting report: ${error.message}`);
            res.status(500).json({ error: 'Failed to export report' });
        }
    }

    /**
     * Get Yearly Placement Stats
     */
    async getYearlyStats(req: Request, res: Response) {
        try {
            const { institutionId } = req.params;
            const { year } = req.query;
            const stats = await reportService.getYearlyPlacementStats(institutionId, Number(year) || new Date().getFullYear());
            res.status(200).json(stats);
        } catch (error: any) {
            logger.error(`Error fetching yearly stats: ${error.message}`);
            res.status(500).json({ error: 'Failed to fetch yearly stats' });
        }
    }
}

export const reportController = new ReportController();
