import ExcelJS from 'exceljs';
import { AccreditationReportData } from '../services/report.service';

/**
 * Generate Excel for Accreditation Report
 */
export async function generateAccreditationExcel(data: AccreditationReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Accreditation Report');

    // Title
    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Accreditation Report - ${data.institutionName}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:C2');
    const cobrandCell = sheet.getCell('A2');
    cobrandCell.value = 'Powered by PlaceNxt Intelligence';
    cobrandCell.font = { size: 12, italic: true, color: { argb: 'FF6366F1' } };
    cobrandCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:C3');
    const academicYearCell = sheet.getCell('A3');
    academicYearCell.value = `Academic Year: ${data.academicYear}`;
    academicYearCell.alignment = { horizontal: 'center' };

    sheet.addRow([]); // Blank row

    // Core Metrics
    sheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: data.institutionName, key: 'value', width: 40 },
    ];

    sheet.addRows([
        { metric: 'Total Students', value: data.totalStudents },
        { metric: 'Graduated Students', value: data.graduatedStudents },
        { metric: 'Placed Students', value: data.placedStudents },
        { metric: 'Higher Studies', value: data.higherStudiesStudents },
        { metric: 'Placement Rate', value: `${data.placementRate.toFixed(2)}%` },
        { metric: 'Median Salary', value: `${data.medianSalary.toLocaleString()} INR` },
    ]);

    sheet.addRow([]); // Blank row
    sheet.addRow(['Top Recruiters']);
    data.topRecruiters.forEach((recruiter, index) => {
        sheet.addRow([`${index + 1}.`, recruiter]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
}
