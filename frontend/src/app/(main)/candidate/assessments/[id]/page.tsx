import { StudentAssessmentInterface } from '@/components/assessment/StudentAssessmentInterface';

export default function StudentAssessmentPage({ params }: { params: { id: string } }) {
    return (
        <div className="container mx-auto py-12">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">Candidate Assessment</h1>
                <p className="text-muted-foreground mt-2">Please ensure you are in a quiet environment and do not switch tabs during the test.</p>
            </div>
            <StudentAssessmentInterface attemptId={params.id} />
        </div>
    );
}
