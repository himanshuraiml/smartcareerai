import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

const INSIGHTS = [
    { title: 'Use Action Verbs', content: 'Start bullet points with action verbs like "Led", "Developed", or "Achieved" to make an instant impact on recruiters.', category: 'Resume Tip', icon: 'FileText', color: 'text-blue-500', tags: ['resume', 'action-verbs'] },
    { title: 'Quantify Your Results', content: 'Recruiters love numbers! "Increased sales by 25%" is way more impactful than "Improved sales performance" every time.', category: 'Resume Tip', icon: 'FileText', color: 'text-blue-500', tags: ['resume', 'metrics'] },
    { title: 'ATS Keywords Matter', content: 'Mirror keywords from the job description in your resume to beat Applicant Tracking Systems and get noticed.', category: 'Resume Tip', icon: 'FileText', color: 'text-blue-500', tags: ['resume', 'ats'] },
    { title: 'One-Page Rule', content: 'Keep your resume to one page unless you have 10+ years of experience. Brevity shows you can prioritize.', category: 'Resume Tip', icon: 'FileText', color: 'text-blue-500', tags: ['resume', 'formatting'] },
    { title: 'Custom Summaries Win', content: 'Tailor your professional summary for each job. Generic summaries get generic results.', category: 'Resume Tip', icon: 'FileText', color: 'text-blue-500', tags: ['resume', 'tailoring'] },
    { title: 'STAR Method', content: 'Structure answers as Situation, Task, Action, Result for behavioral questions. It keeps you focused and impressive.', category: 'Interview Tip', icon: 'Mic', color: 'text-rose-500', tags: ['interview', 'behavioral'] },
    { title: 'Research the Company', content: 'Know their recent news, products, and culture before the interview. It shows genuine interest and preparation.', category: 'Interview Tip', icon: 'Mic', color: 'text-rose-500', tags: ['interview', 'preparation'] },
    { title: 'Prepare Questions', content: 'Always have 2-3 thoughtful questions ready for the interviewer. It demonstrates engagement and curiosity.', category: 'Interview Tip', icon: 'Mic', color: 'text-rose-500', tags: ['interview', 'questions'] },
    { title: 'Mock Practice', content: 'Practicing out loud improves confidence by 60% compared to mental rehearsal. Record yourself and review!', category: 'Interview Tip', icon: 'Mic', color: 'text-rose-500', tags: ['interview', 'practice'] },
    { title: 'Body Language', content: 'Maintain eye contact, sit upright, and use hand gestures naturally. Non-verbal cues account for 55% of communication.', category: 'Interview Tip', icon: 'Mic', color: 'text-rose-500', tags: ['interview', 'communication'] },
    { title: 'Network Actively', content: '85% of jobs are filled through networking. Connect with 2-3 new professionals in your field every week.', category: 'Career Insight', icon: 'TrendingUp', color: 'text-emerald-500', tags: ['networking', 'career'] },
    { title: 'Skill Stacking', content: 'Combining 2-3 complementary skills makes you uniquely valuable. Example: Design + Coding + Marketing.', category: 'Career Insight', icon: 'TrendingUp', color: 'text-emerald-500', tags: ['skills', 'career'] },
    { title: 'Follow-Up Matters', content: 'Sending a thank-you email within 24 hours increases your callback rate by 40%. Keep it brief and personalized.', category: 'Career Insight', icon: 'TrendingUp', color: 'text-emerald-500', tags: ['networking', 'follow-up'] },
    { title: 'Portfolio Power', content: 'Candidates with project portfolios get 2x more interview callbacks. Showcase your work, not just words.', category: 'Career Insight', icon: 'TrendingUp', color: 'text-emerald-500', tags: ['portfolio', 'projects'] },
    { title: 'Personal Brand', content: 'A consistent LinkedIn profile with regular posts increases recruiter visibility by 5x. Be active, not just present.', category: 'Career Insight', icon: 'TrendingUp', color: 'text-emerald-500', tags: ['linkedin', 'branding'] },
    { title: 'GitHub Activity', content: 'Consistent GitHub contributions show passion. Even small daily commits build an impressive profile over time.', category: 'Tech Tip', icon: 'Code', color: 'text-purple-500', tags: ['github', 'coding'] },
    { title: 'System Design', content: 'For senior roles, system design skills are crucial. Practice designing scalable systems like Twitter or Uber.', category: 'Tech Tip', icon: 'Code', color: 'text-purple-500', tags: ['system-design', 'architecture'] },
    { title: 'Clean Code', content: 'Write code like the next person to read it is a serial killer who knows where you live. Readability matters!', category: 'Tech Tip', icon: 'Code', color: 'text-purple-500', tags: ['clean-code', 'best-practices'] },
    { title: 'DSA Practice', content: 'Solve 2-3 LeetCode problems daily. Consistency beats cramming - aim for 100+ problems before interviews.', category: 'Tech Tip', icon: 'Code', color: 'text-purple-500', tags: ['dsa', 'leetcode'] },
    { title: 'Read Documentation', content: 'Deep knowledge of framework docs sets you apart. Most developers only skim the surface.', category: 'Tech Tip', icon: 'Code', color: 'text-purple-500', tags: ['learning', 'documentation'] },
    { title: 'Active Listening', content: 'In interviews, listen fully before responding. Pausing to think shows confidence, not weakness.', category: 'Soft Skills', icon: 'Users', color: 'text-amber-500', tags: ['interpersonal', 'listening'] },
    { title: 'Storytelling', content: 'Great stories make you memorable. Frame your experiences as mini-narratives with conflict and resolution.', category: 'Soft Skills', icon: 'Users', color: 'text-amber-500', tags: ['communication', 'storytelling'] },
    { title: 'Emotional Intelligence', content: 'Teams value EQ as much as IQ. Show self-awareness and empathy in your interactions.', category: 'Soft Skills', icon: 'Users', color: 'text-amber-500', tags: ['eq', 'teamwork'] },
    { title: 'Conflict Resolution', content: 'Be ready to share how you handled disagreements constructively. It shows maturity and teamwork.', category: 'Soft Skills', icon: 'Users', color: 'text-amber-500', tags: ['teamwork', 'leadership'] },
    { title: 'Growth Mindset', content: 'Talk about failures as learning opportunities. Companies want people who grow from setbacks.', category: 'Soft Skills', icon: 'Users', color: 'text-amber-500', tags: ['mindset', 'growth'] },
    { title: 'Salary Research', content: 'Know your market value before negotiations. Use Glassdoor, levels.fyi, and LinkedIn Salary insights.', category: 'Pro Tip', icon: 'Rocket', color: 'text-cyan-500', tags: ['negotiation', 'salary'] },
    { title: 'Timing Matters', content: 'Apply to jobs on Monday or Tuesday mornings. Your application lands at the top of the pile.', category: 'Pro Tip', icon: 'Rocket', color: 'text-cyan-500', tags: ['job-search', 'application'] },
    { title: 'Reference Prep', content: "Give your references a heads up and share the job description. They'll advocate better with context.", category: 'Pro Tip', icon: 'Rocket', color: 'text-cyan-500', tags: ['references', 'hiring'] },
    { title: 'Rejection = Data', content: "Every rejection teaches something. Ask for feedback when possible - it's free coaching.", category: 'Pro Tip', icon: 'Rocket', color: 'text-cyan-500', tags: ['mindset', 'resilience'] },
    { title: 'Energy Management', content: "Job searching is a marathon. Take breaks, celebrate small wins, and don't burn out.", category: 'Pro Tip', icon: 'Rocket', color: 'text-cyan-500', tags: ['wellbeing', 'productivity'] },
    { title: 'Multiple Offers', content: 'Apply broadly to create options. Having multiple offers gives you negotiation power.', category: 'Pro Tip', icon: 'Rocket', color: 'text-cyan-500', tags: ['offers', 'negotiation'] }
];

const SPRINT_CARDS = {
    'JavaScript': [
        { front: 'What is the output of typeof null in JavaScript?', back: '"object" - this is a historical bug in JavaScript from its first version.', tags: ['basics', 'types'] },
        { front: 'What is the difference between == and ===?', back: '== compares values with type coercion. === compares both value and type strictly.', tags: ['operators', 'comparison'] },
        { front: 'What is a closure in JavaScript?', back: 'A function that retains access to its outer lexical scope variables even after it executes.', tags: ['advanced', 'scope'] },
        { front: 'What is the difference between var, let, and const?', back: 'var is function-scoped and hoisted. let and const are block-scoped and not hoisted. const values cannot be reassigned.', tags: ['basics', 'variables'] },
        { front: 'What does Promise.all() do?', back: 'Executes multiple promises in parallel. Resolves when all succeed, or rejects immediately when any single one fails.', tags: ['async', 'promises'] }
    ],
    'Python': [
        { front: 'How is memory managed in Python?', back: 'Automatic reference counting combined with a cycle-detecting garbage collector.', tags: ['advanced', 'memory'] },
        { front: 'What is the difference between a list and a tuple?', back: 'Lists are mutable (can be altered). Tuples are immutable (cannot be changed after creation).', tags: ['basics', 'data-structures'] },
        { front: 'What is a generator in Python?', back: 'A function that returns an iterator using the "yield" keyword, producing values lazily on demand.', tags: ['advanced', 'iterators'] },
        { front: 'What does the __init__ method do?', back: 'It acts as the constructor to initialize an object\'s attributes when a class instance is created.', tags: ['oop', 'classes'] },
        { front: 'What is the difference between "is" and "==" in Python?', back: '"is" checks object identity (same memory address). "==" checks value equality (same value contents).', tags: ['operators', 'comparison'] }
    ],
    'React': [
        { front: 'What is the Virtual DOM?', back: 'An in-memory lightweight representation of the actual DOM, used to compute and batch updates efficiently.', tags: ['concepts', 'performance'] },
        { front: 'What are the two main rules of React Hooks?', back: '1) Only call hooks at the top level. 2) Only call hooks from React function components or custom hooks.', tags: ['hooks', 'rules'] },
        { front: 'Why do you need "key" prop in lists?', back: 'It helps React identify which items have changed, been added, or removed, avoiding complete re-renders.', tags: ['basics', 'lists'] },
        { front: 'What is the difference between useMemo and useCallback?', back: 'useMemo memoizes the returned value of a function. useCallback memoizes the function definition itself.', tags: ['hooks', 'optimization'] },
        { front: 'What is React Context used for?', back: 'To share state/data globally across the component tree, preventing prop-drilling down multiple levels.', tags: ['state', 'context'] }
    ],
    'SQL': [
        { front: 'What is a primary key?', back: 'A column or combination of columns that uniquely identifies each row in a database table.', tags: ['basics', 'keys'] },
        { front: 'What is the difference between WHERE and HAVING?', back: 'WHERE filters rows before grouping is performed. HAVING filters groups after GROUP BY executes.', tags: ['queries', 'filtering'] },
        { front: 'What is a database transaction?', back: 'A logical unit of work that executes fully or not at all, adhering to ACID principles.', tags: ['transactions', 'acid'] },
        { front: 'What is the difference between INNER JOIN and LEFT JOIN?', back: 'INNER JOIN returns rows with matches in both tables. LEFT JOIN returns all rows from the left table and matches from the right.', tags: ['queries', 'joins'] },
        { front: 'What is a database index?', back: 'A data structure that improves the speed of data retrieval operations on a database table.', tags: ['optimization', 'performance'] }
    ],
    'Git': [
        { front: 'What is the difference between git fetch and git pull?', back: 'fetch downloads changes from the remote without merging them. pull downloads and immediately merges them.', tags: ['basics', 'remote'] },
        { front: 'What does git stash do?', back: 'Temporarily stores modified, tracked files on a stack so you can switch branches with a clean slate.', tags: ['commands', 'workflow'] },
        { front: 'What is the difference between git merge and git rebase?', back: 'merge creates a new commit combining histories. rebase reapplies commits on top of another base tip for a linear history.', tags: ['advanced', 'history'] },
        { front: 'How do you undo the latest commit but keep its changes locally?', back: 'Run: git reset --soft HEAD~1', tags: ['commands', 'reset'] },
        { front: 'What is a merge conflict?', back: 'An event when Git cannot resolve differences in code between branches automatically, requiring manual intervention.', tags: ['basics', 'conflicts'] }
    ]
};

async function main() {
    console.log('🌱 Seeding Career Insights and Skill Sprint Cards...');

    // 1. Seed Career Insights
    let insightCount = 0;
    for (const insight of INSIGHTS) {
        await prisma.careerInsight.create({
            data: {
                title: insight.title,
                content: insight.content,
                category: insight.category,
                icon: insight.icon,
                color: insight.color,
                tags: insight.tags,
                source: 'curated',
            }
        });
        insightCount++;
    }
    console.log(`✅ Seeded ${insightCount} Career Insights.`);

    // 2. Seed Skill Sprint Cards
    let cardCount = 0;
    for (const [skillName, cards] of Object.entries(SPRINT_CARDS)) {
        const skill = await prisma.skill.findFirst({
            where: { name: { equals: skillName, mode: 'insensitive' } }
        });

        if (!skill) {
            console.log(`⚠️ Skill "${skillName}" not found in DB. Skipping flashcards.`);
            continue;
        }

        for (const card of cards) {
            await prisma.skillSprintCard.create({
                data: {
                    skillId: skill.id,
                    front: card.front,
                    back: card.back,
                    difficulty: Difficulty.EASY,
                    tags: card.tags,
                }
            });
            cardCount++;
        }
        console.log(`  ✓ Seeded flashcards for skill: ${skillName}`);
    }

    console.log(`✅ Seeded ${cardCount} Skill Sprint Cards.`);
}

main()
    .catch((e) => {
        console.error('Error seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
