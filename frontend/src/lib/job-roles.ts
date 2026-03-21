export interface JobRole {
    id: string;
    title: string;
    category: string;
}

/** Matches the seeded job roles in the Railway DB. Used as fallback when API is unreachable. */
export const FALLBACK_JOB_ROLES: JobRole[] = [
    { id: 'fe716004-684a-4cce-944a-ff1bb3371f21', title: 'Backend Developer', category: 'Engineering' },
    { id: 'f802b12e-8671-4c1e-9be7-34519ff178d0', title: 'Frontend Developer', category: 'Engineering' },
    { id: 'c9b0b929-c4e6-4569-9198-404a9d5491b6', title: 'Full Stack Developer', category: 'Engineering' },
    { id: 'ca4bb70b-487a-46bd-8f4f-eb9a5385b822', title: 'Mobile Developer', category: 'Engineering' },
    { id: 'bd6e4ce4-247f-471b-a1ff-d082c4f9edc0', title: 'Machine Learning Engineer', category: 'Engineering' },
    { id: 'f32f7a5e-7e65-45d3-a6a7-14de2ec1ea35', title: 'Cloud Engineer', category: 'Engineering' },
    { id: 'cbc6c3e7-d012-4767-ab3d-6d619fb54380', title: 'DevOps Engineer', category: 'Engineering' },
    { id: 'f6b2811a-6f10-4f04-a850-b4f7391935bc', title: 'QA Engineer', category: 'Engineering' },
    { id: '6bcc68a6-da63-4a82-afa4-c38bd093633f', title: 'Software Developer', category: 'Engineering' },
    { id: 'ef05efe2-c1fa-405c-9304-2162201f3378', title: 'Data Analyst', category: 'Data' },
    { id: '5fdb4af8-9c15-4ba8-8b72-e2949d03d37a', title: 'Data Scientist', category: 'Data' },
    { id: '9e3e1d13-a663-4546-9f8b-8a93159765c9', title: 'UI/UX Designer', category: 'Design' },
    { id: '2b74de89-9a9c-470a-b2c7-0025ea569eb7', title: 'Product Manager', category: 'Product' },
    { id: 'add2540b-b578-43a9-91e4-53d0e427415f', title: 'Project Manager', category: 'Management' },
    { id: 'c79bb5b1-a862-495b-8a7c-e0eb5d066af3', title: 'Cybersecurity Analyst', category: 'Security' },
    { id: '3de0b034-e805-427c-96ec-41c0c024f913', title: 'Cybersecurity Engineer', category: 'Security' },
];

export async function fetchJobRoles(fetcher: (url: string, opts?: RequestInit) => Promise<Response>): Promise<JobRole[]> {
    try {
        const res = await fetcher('/job-roles');
        if (res.ok) {
            const json = await res.json();
            const roles: JobRole[] = json.data || [];
            return roles.length > 0 ? roles : FALLBACK_JOB_ROLES;
        }
    } catch {
        // network error or API unreachable
    }
    return FALLBACK_JOB_ROLES;
}
