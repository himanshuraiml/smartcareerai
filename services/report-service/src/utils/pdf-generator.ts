import PDFDocument from 'pdfkit';
import { AccreditationReportData } from '../services/report.service';

/**
 * Generate PDF for Accreditation Report
 */
export async function generateAccreditationPdf(data: AccreditationReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).text(`Accreditation Report - ${data.institutionName}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).fillColor('#6366f1').text('Powered by PlaceNxt Intelligence', { align: 'center' });
        doc.fillColor('black');
        doc.moveDown();
        doc.fontSize(12).text(`Academic Year: ${data.academicYear}`, { align: 'center' });
        doc.moveDown(2);

        // Core Summary
        doc.fontSize(16).text('Placement Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Students: ${data.totalStudents}`);
        doc.text(`Graduated Students: ${data.graduatedStudents}`);
        doc.text(`Placed Students: ${data.placedStudents}`);
        doc.text(`Higher Studies: ${data.higherStudiesStudents}`);
        doc.moveDown();
        doc.text(`Placement Rate: ${data.placementRate.toFixed(2)}%`);
        doc.text(`Median Salary: ${data.medianSalary.toLocaleString()} INR`);
        doc.moveDown(2);

        // Top Recruiters
        doc.fontSize(16).text('Top Recruiters', { underline: true });
        doc.moveDown();
        data.topRecruiters.forEach((recruiter, index) => {
            doc.fontSize(12).text(`${index + 1}. ${recruiter}`);
        });

        // Certification Note
        doc.moveDown(4);
        doc.fontSize(10)
            .font('Helvetica-Oblique')
            .text('This report is automatically generated for accreditation purposes (NAAC/NBA/NIRF).', { align: 'center' });
        doc.font('Helvetica');

        doc.end();
    });
}
