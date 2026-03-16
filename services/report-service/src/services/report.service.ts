import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AccreditationReportData {
    institutionName: string;
    academicYear: string;
    totalStudents: number;
    graduatedStudents: number;
    placedStudents: number;
    higherStudiesStudents: number;
    medianSalary: number;
    topRecruiters: string[];
    placementRate: number;
}

export class ReportService {
    /**
     * Generate NIRF Data for an institution
     */
    async getNirfData(institutionId: string, year: number): Promise<AccreditationReportData> {
        logger.info(`Fetching NIRF data for institution ${institutionId} and year ${year}`);

        const institution = await prisma.institution.findUnique({
            where: { id: institutionId },
            select: { name: true }
        });

        if (!institution) throw new Error('Institution not found');

        const [totalStudents, placedStudentsData] = await Promise.all([
            // Students in final year (assuming students with graduationYear == year)
            prisma.user.count({
                where: { institutionId, role: 'USER', studentProfile: { graduationYear: year } }
            }),
            // Students placed
            prisma.campusPlacement.findMany({
                where: { institutionId, placedAt: { gte: new Date(`${year - 1}-07-01`), lte: new Date(`${year}-06-30`) } },
                select: { salaryOffered: true, companyName: true }
            })
        ]);

        const placedCount = placedStudentsData.length;
        const salaries = placedStudentsData.map(p => p.salaryOffered || 0).sort((a, b) => a - b);

        let medianSalary = 0;
        if (salaries.length > 0) {
            const mid = Math.floor(salaries.length / 2);
            medianSalary = salaries.length % 2 !== 0 ? salaries[mid] : (salaries[mid - 1] + salaries[mid]) / 2;
        }

        const recruiters = Array.from(new Set(placedStudentsData.map(p => p.companyName))).slice(0, 10);

        // Approximation for NIRF (Normally NIRF needs 3 years, but for this task we provide current year)
        return {
            institutionName: institution.name,
            academicYear: `${year - 1}-${year}`,
            totalStudents,
            graduatedStudents: totalStudents, // Assuming all graduated for now
            placedStudents: placedCount,
            higherStudiesStudents: 0, // Placeholder
            medianSalary,
            topRecruiters: recruiters,
            placementRate: totalStudents > 0 ? (placedCount / totalStudents) * 100 : 0
        };
    }

    /**
     * Get Placement Statistics for Yearly Reports
     */
    async getYearlyPlacementStats(institutionId: string, year: number) {
        logger.info(`Generating yearly placement stats for institution ${institutionId} and year ${year}`);

        const startDate = new Date(`${year - 1}-07-01`);
        const endDate = new Date(`${year}-06-30`);

        const placementsWithProfiles = await prisma.campusPlacement.findMany({
            where: { institutionId, placedAt: { gte: startDate, lte: endDate } },
            include: { user: { include: { studentProfile: true } } }
        });

        const branchStats: Record<string, { total: number, placed: number, totalSalary: number }> = {};

        // Get total students scheduled for graduation in this academic year
        const studentsPerBranch = await prisma.studentProfile.groupBy({
            by: ['branch'],
            where: { institutionId, graduationYear: year },
            _count: { userId: true }
        });

        studentsPerBranch.forEach(sb => {
            branchStats[sb.branch] = { total: sb._count.userId, placed: 0, totalSalary: 0 };
        });

        placementsWithProfiles.forEach(p => {
            const branch = p.user.studentProfile?.branch || 'Unknown';
            if (!branchStats[branch]) {
                branchStats[branch] = { total: 0, placed: 0, totalSalary: 1 }; // 1 to avoid /0 for total (though totalSalary 0 is fine)
            }
            branchStats[branch].placed++;
            branchStats[branch].totalSalary += p.salaryOffered || 0;
        });

        const formattedStats = Object.entries(branchStats).map(([branch, data]) => ({
            branch,
            totalStudents: data.total,
            placedStudents: data.placed,
            averagePackage: data.placed > 0 ? Number((data.totalSalary / data.placed).toFixed(2)) : 0,
            placementPercentage: data.total > 0 ? Number(((data.placed / data.total) * 100).toFixed(2)) : 0
        }));

        const totalStudentsCount = studentsPerBranch.reduce((acc, curr) => acc + curr._count.userId, 0);
        const totalPlacedCount = placementsWithProfiles.length;

        // Calculate Median Salary
        const salaries = placementsWithProfiles.map(p => p.salaryOffered || 0).sort((a, b) => a - b);
        let medianSalary = 0;
        if (salaries.length > 0) {
            const mid = Math.floor(salaries.length / 2);
            medianSalary = salaries.length % 2 !== 0 ? salaries[mid] : (salaries[mid - 1] + salaries[mid]) / 2;
        }

        return {
            year,
            totalStudents: totalStudentsCount,
            totalPlaced: totalPlacedCount,
            placementRate: totalStudentsCount > 0 ? Number(((totalPlacedCount / totalStudentsCount) * 100).toFixed(2)) : 0,
            medianSalary,
            branchWise: formattedStats
        };
    }
}

export const reportService = new ReportService();
