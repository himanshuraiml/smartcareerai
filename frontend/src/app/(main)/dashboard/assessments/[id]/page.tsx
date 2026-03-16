import { StudentAssessmentInterface } from '@/components/assessment/StudentAssessmentInterface';

export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div>
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">Candidate Assessment</h1>
                <p className="text-muted-foreground mt-2">Please ensure you are in a quiet environment and do not switch tabs during the test.</p>
            </div>
            <StudentAssessmentInterface attemptId={id} />
        </div>
    );
}
