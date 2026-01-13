import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Seed job roles
    const jobRoles = [
        {
            title: 'Software Developer',
            category: 'Engineering',
            requiredSkills: ['JavaScript', 'Python', 'Java', 'Git', 'SQL', 'REST APIs'],
            preferredSkills: ['React', 'Node.js', 'Docker', 'AWS', 'TypeScript'],
            keywords: ['software', 'developer', 'programming', 'coding', 'engineer', 'development'],
        },
        {
            title: 'Frontend Developer',
            category: 'Engineering',
            requiredSkills: ['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript'],
            preferredSkills: ['Next.js', 'Vue.js', 'Tailwind CSS', 'Redux'],
            keywords: ['frontend', 'react', 'javascript', 'ui', 'web development', 'responsive design'],
        },
        {
            title: 'Backend Developer',
            category: 'Engineering',
            requiredSkills: ['Node.js', 'Python', 'SQL', 'REST APIs', 'Git'],
            preferredSkills: ['Docker', 'AWS', 'GraphQL', 'Redis', 'Kubernetes'],
            keywords: ['backend', 'api', 'server', 'database', 'microservices'],
        },
        {
            title: 'Full Stack Developer',
            category: 'Engineering',
            requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
            preferredSkills: ['TypeScript', 'Docker', 'AWS', 'GraphQL', 'MongoDB'],
            keywords: ['fullstack', 'full-stack', 'web developer', 'mern', 'mean'],
        },
        {
            title: 'Data Scientist',
            category: 'Data',
            requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Pandas'],
            preferredSkills: ['TensorFlow', 'PyTorch', 'Spark', 'Deep Learning', 'NLP'],
            keywords: ['data science', 'ml', 'ai', 'analytics', 'modeling'],
        },
        {
            title: 'Data Analyst',
            category: 'Data',
            requiredSkills: ['SQL', 'Excel', 'Python', 'Data Visualization', 'Statistics'],
            preferredSkills: ['Tableau', 'Power BI', 'R', 'Pandas'],
            keywords: ['data analyst', 'analytics', 'reporting', 'insights'],
        },
        {
            title: 'DevOps Engineer',
            category: 'Engineering',
            requiredSkills: ['Linux', 'Docker', 'CI/CD', 'AWS', 'Kubernetes'],
            preferredSkills: ['Terraform', 'Ansible', 'Prometheus', 'GitLab CI'],
            keywords: ['devops', 'infrastructure', 'sre', 'cloud', 'automation'],
        },
        {
            title: 'Cloud Engineer',
            category: 'Engineering',
            requiredSkills: ['AWS', 'Azure', 'Linux', 'Networking', 'Docker'],
            preferredSkills: ['Kubernetes', 'Terraform', 'Python', 'Security'],
            keywords: ['cloud', 'aws', 'azure', 'gcp', 'infrastructure'],
        },
        {
            title: 'Product Manager',
            category: 'Product',
            requiredSkills: ['Product Strategy', 'Agile', 'User Research', 'Roadmapping'],
            preferredSkills: ['SQL', 'Data Analysis', 'A/B Testing', 'Figma'],
            keywords: ['product', 'pm', 'strategy', 'roadmap', 'stakeholder'],
        },
        {
            title: 'Project Manager',
            category: 'Management',
            requiredSkills: ['Project Planning', 'Agile', 'Scrum', 'Stakeholder Management'],
            preferredSkills: ['Jira', 'MS Project', 'Risk Management', 'Budgeting'],
            keywords: ['project', 'management', 'pmp', 'scrum master'],
        },
        {
            title: 'UI/UX Designer',
            category: 'Design',
            requiredSkills: ['Figma', 'User Research', 'Wireframing', 'Prototyping'],
            preferredSkills: ['Adobe XD', 'Sketch', 'HTML/CSS', 'Design Systems'],
            keywords: ['design', 'ui', 'ux', 'user experience', 'interface'],
        },
        {
            title: 'Machine Learning Engineer',
            category: 'Engineering',
            requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'ML Algorithms', 'SQL'],
            preferredSkills: ['MLOps', 'Kubernetes', 'Spark', 'Computer Vision'],
            keywords: ['ml engineer', 'machine learning', 'deep learning', 'ai'],
        },
        {
            title: 'Mobile Developer',
            category: 'Engineering',
            requiredSkills: ['React Native', 'Swift', 'Kotlin', 'JavaScript', 'Git'],
            preferredSkills: ['Flutter', 'iOS', 'Android', 'Firebase'],
            keywords: ['mobile', 'ios', 'android', 'app development'],
        },
        {
            title: 'QA Engineer',
            category: 'Engineering',
            requiredSkills: ['Test Automation', 'Selenium', 'Manual Testing', 'SQL'],
            preferredSkills: ['Cypress', 'Jest', 'Performance Testing', 'API Testing'],
            keywords: ['qa', 'testing', 'quality assurance', 'automation'],
        },
        {
            title: 'Cybersecurity Analyst',
            category: 'Security',
            requiredSkills: ['Network Security', 'SIEM', 'Vulnerability Assessment', 'Linux'],
            preferredSkills: ['Penetration Testing', 'Python', 'Cloud Security', 'Compliance'],
            keywords: ['security', 'cyber', 'infosec', 'threat detection'],
        },
    ];

    for (const role of jobRoles) {
        await prisma.jobRole.upsert({
            where: { title: role.title },
            update: role,
            create: role,
        });
    }
    console.log(`✅ Seeded ${jobRoles.length} job roles`);

    // Seed skills
    const skills = [
        { name: 'JavaScript', category: 'Programming', demandScore: 95 },
        { name: 'Python', category: 'Programming', demandScore: 95 },
        { name: 'React', category: 'Framework', demandScore: 90 },
        { name: 'Node.js', category: 'Runtime', demandScore: 88 },
        { name: 'TypeScript', category: 'Programming', demandScore: 85 },
        { name: 'SQL', category: 'Database', demandScore: 90 },
        { name: 'Git', category: 'Tool', demandScore: 88 },
        { name: 'AWS', category: 'Cloud', demandScore: 85 },
        { name: 'Docker', category: 'DevOps', demandScore: 82 },
        { name: 'Kubernetes', category: 'DevOps', demandScore: 78 },
        { name: 'Java', category: 'Programming', demandScore: 85 },
        { name: 'HTML', category: 'Web', demandScore: 85 },
        { name: 'CSS', category: 'Web', demandScore: 85 },
        { name: 'REST APIs', category: 'Architecture', demandScore: 88 },
        { name: 'MongoDB', category: 'Database', demandScore: 75 },
        { name: 'PostgreSQL', category: 'Database', demandScore: 80 },
        { name: 'Linux', category: 'OS', demandScore: 80 },
        { name: 'Machine Learning', category: 'AI', demandScore: 82 },
        { name: 'TensorFlow', category: 'AI', demandScore: 75 },
        { name: 'PyTorch', category: 'AI', demandScore: 75 },
        { name: 'Agile', category: 'Methodology', demandScore: 80 },
        { name: 'Scrum', category: 'Methodology', demandScore: 78 },
        { name: 'Figma', category: 'Design', demandScore: 75 },
        { name: 'Next.js', category: 'Framework', demandScore: 78 },
        { name: 'GraphQL', category: 'API', demandScore: 72 },
    ];

    for (const skill of skills) {
        await prisma.skill.upsert({
            where: { name: skill.name },
            update: skill,
            create: skill,
        });
    }
    console.log(`✅ Seeded ${skills.length} skills`);

    // Get skill IDs for tests
    const jsSkill = await prisma.skill.findUnique({ where: { name: 'JavaScript' } });
    const pySkill = await prisma.skill.findUnique({ where: { name: 'Python' } });
    const reactSkill = await prisma.skill.findUnique({ where: { name: 'React' } });
    const sqlSkill = await prisma.skill.findUnique({ where: { name: 'SQL' } });

    // Seed skill tests
    const skillTests = [
        {
            skillId: jsSkill?.id || '',
            title: 'JavaScript Fundamentals',
            description: 'Test your knowledge of JavaScript basics including variables, functions, and DOM manipulation.',
            difficulty: 'MEDIUM' as const,
            durationMinutes: 15,
            passingScore: 70,
            questionsCount: 10,
        },
        {
            skillId: pySkill?.id || '',
            title: 'Python Basics',
            description: 'Assess your Python programming skills covering syntax, data structures, and functions.',
            difficulty: 'MEDIUM' as const,
            durationMinutes: 15,
            passingScore: 70,
            questionsCount: 10,
        },
        {
            skillId: reactSkill?.id || '',
            title: 'React Essentials',
            description: 'Validate your React knowledge including components, hooks, and state management.',
            difficulty: 'MEDIUM' as const,
            durationMinutes: 20,
            passingScore: 70,
            questionsCount: 10,
        },
        {
            skillId: sqlSkill?.id || '',
            title: 'SQL Fundamentals',
            description: 'Test your SQL proficiency with queries, joins, and database concepts.',
            difficulty: 'MEDIUM' as const,
            durationMinutes: 15,
            passingScore: 70,
            questionsCount: 10,
        },
    ];

    for (const testData of skillTests) {
        if (!testData.skillId) continue;

        await prisma.skillTest.upsert({
            where: { id: `test-${testData.skillId}` },
            update: testData,
            create: { id: `test-${testData.skillId}`, ...testData },
        });
    }
    console.log(`✅ Seeded ${skillTests.length} skill tests`);

    // Seed test questions
    const jsQuestions = jsSkill ? [
        { testId: `test-${jsSkill.id}`, questionText: 'What is the output of: typeof null?', options: ['null', 'undefined', 'object', 'number'], correctAnswer: 'object', orderIndex: 1 },
        { testId: `test-${jsSkill.id}`, questionText: 'Which method adds an element to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 'push()', orderIndex: 2 },
        { testId: `test-${jsSkill.id}`, questionText: 'What does === mean in JavaScript?', options: ['Assignment', 'Equality', 'Strict equality', 'Comparison'], correctAnswer: 'Strict equality', orderIndex: 3 },
        { testId: `test-${jsSkill.id}`, questionText: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const', 'Both let and const'], correctAnswer: 'Both let and const', orderIndex: 4 },
        { testId: `test-${jsSkill.id}`, questionText: 'What is a closure in JavaScript?', options: ['A loop', 'A function with access to outer scope', 'An object', 'An error'], correctAnswer: 'A function with access to outer scope', orderIndex: 5 },
        { testId: `test-${jsSkill.id}`, questionText: 'Which method converts JSON string to object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.object()'], correctAnswer: 'JSON.parse()', orderIndex: 6 },
        { testId: `test-${jsSkill.id}`, questionText: 'What does async/await handle?', options: ['Loops', 'Promises', 'Objects', 'Arrays'], correctAnswer: 'Promises', orderIndex: 7 },
        { testId: `test-${jsSkill.id}`, questionText: 'Which is NOT a JavaScript data type?', options: ['string', 'boolean', 'float', 'symbol'], correctAnswer: 'float', orderIndex: 8 },
        { testId: `test-${jsSkill.id}`, questionText: 'What is the spread operator?', options: ['...', '..', '***', '+++'], correctAnswer: '...', orderIndex: 9 },
        { testId: `test-${jsSkill.id}`, questionText: 'Which method creates a new array with filtered elements?', options: ['map()', 'filter()', 'reduce()', 'forEach()'], correctAnswer: 'filter()', orderIndex: 10 },
    ] : [];

    const pyQuestions = pySkill ? [
        { testId: `test-${pySkill.id}`, questionText: 'How do you create a list in Python?', options: ['{}', '[]', '()', '<>'], correctAnswer: '[]', orderIndex: 1 },
        { testId: `test-${pySkill.id}`, questionText: 'What keyword defines a function?', options: ['function', 'def', 'func', 'define'], correctAnswer: 'def', orderIndex: 2 },
        { testId: `test-${pySkill.id}`, questionText: 'Which is used for comments in Python?', options: ['//', '/* */', '#', '--'], correctAnswer: '#', orderIndex: 3 },
        { testId: `test-${pySkill.id}`, questionText: 'What is the output of: 3 ** 2?', options: ['6', '9', '5', '1'], correctAnswer: '9', orderIndex: 4 },
        { testId: `test-${pySkill.id}`, questionText: 'Which method adds an item to a list?', options: ['add()', 'append()', 'push()', 'insert()'], correctAnswer: 'append()', orderIndex: 5 },
        { testId: `test-${pySkill.id}`, questionText: 'What is a dictionary in Python?', options: ['Ordered list', 'Key-value pairs', 'Tuple', 'Set'], correctAnswer: 'Key-value pairs', orderIndex: 6 },
        { testId: `test-${pySkill.id}`, questionText: 'How do you start a for loop?', options: ['for i in range():', 'for (i=0):', 'for i:', 'loop i in:'], correctAnswer: 'for i in range():', orderIndex: 7 },
        { testId: `test-${pySkill.id}`, questionText: 'What does len() return?', options: ['Type', 'Length', 'Sum', 'Index'], correctAnswer: 'Length', orderIndex: 8 },
        { testId: `test-${pySkill.id}`, questionText: 'Which keyword is used for exception handling?', options: ['catch', 'try', 'except', 'Both try and except'], correctAnswer: 'Both try and except', orderIndex: 9 },
        { testId: `test-${pySkill.id}`, questionText: 'What is self in a class method?', options: ['A keyword', 'Reference to instance', 'A variable', 'A function'], correctAnswer: 'Reference to instance', orderIndex: 10 },
    ] : [];

    const reactQuestions = reactSkill ? [
        { testId: `test-${reactSkill.id}`, questionText: 'What is JSX?', options: ['A JavaScript library', 'Syntax extension for JavaScript', 'A CSS framework', 'A database'], correctAnswer: 'Syntax extension for JavaScript', orderIndex: 1 },
        { testId: `test-${reactSkill.id}`, questionText: 'Which hook manages state in functional components?', options: ['useEffect', 'useState', 'useContext', 'useRef'], correctAnswer: 'useState', orderIndex: 2 },
        { testId: `test-${reactSkill.id}`, questionText: 'What does useEffect do?', options: ['Manages state', 'Handles side effects', 'Creates context', 'Optimizes rendering'], correctAnswer: 'Handles side effects', orderIndex: 3 },
        { testId: `test-${reactSkill.id}`, questionText: 'How do you pass data to a child component?', options: ['State', 'Props', 'Context', 'Refs'], correctAnswer: 'Props', orderIndex: 4 },
        { testId: `test-${reactSkill.id}`, questionText: 'What is the Virtual DOM?', options: ['The actual DOM', 'A lightweight copy of the DOM', 'A CSS framework', 'A database'], correctAnswer: 'A lightweight copy of the DOM', orderIndex: 5 },
        { testId: `test-${reactSkill.id}`, questionText: 'Which method renders a React component?', options: ['React.render()', 'ReactDOM.render()', 'Component.render()', 'App.render()'], correctAnswer: 'ReactDOM.render()', orderIndex: 6 },
        { testId: `test-${reactSkill.id}`, questionText: 'What is the purpose of keys in React lists?', options: ['Styling', 'Unique identification', 'Event handling', 'State management'], correctAnswer: 'Unique identification', orderIndex: 7 },
        { testId: `test-${reactSkill.id}`, questionText: 'How do you create a React app?', options: ['npm init react', 'npx create-react-app', 'npm react-new', 'create react-app'], correctAnswer: 'npx create-react-app', orderIndex: 8 },
        { testId: `test-${reactSkill.id}`, questionText: 'What is a React Fragment?', options: ['A component without DOM node', 'A style component', 'An error boundary', 'A hook'], correctAnswer: 'A component without DOM node', orderIndex: 9 },
        { testId: `test-${reactSkill.id}`, questionText: 'Which hook shares data between components?', options: ['useState', 'useEffect', 'useContext', 'useMemo'], correctAnswer: 'useContext', orderIndex: 10 },
    ] : [];

    const sqlQuestions = sqlSkill ? [
        { testId: `test-${sqlSkill.id}`, questionText: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'], correctAnswer: 'Structured Query Language', orderIndex: 1 },
        { testId: `test-${sqlSkill.id}`, questionText: 'Which clause filters rows?', options: ['SELECT', 'FROM', 'WHERE', 'ORDER BY'], correctAnswer: 'WHERE', orderIndex: 2 },
        { testId: `test-${sqlSkill.id}`, questionText: 'Which JOIN returns all rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correctAnswer: 'FULL OUTER JOIN', orderIndex: 3 },
        { testId: `test-${sqlSkill.id}`, questionText: 'What does GROUP BY do?', options: ['Sorts results', 'Groups rows with same values', 'Filters rows', 'Joins tables'], correctAnswer: 'Groups rows with same values', orderIndex: 4 },
        { testId: `test-${sqlSkill.id}`, questionText: 'Which function counts rows?', options: ['SUM()', 'COUNT()', 'AVG()', 'MAX()'], correctAnswer: 'COUNT()', orderIndex: 5 },
        { testId: `test-${sqlSkill.id}`, questionText: 'What is a PRIMARY KEY?', options: ['A foreign reference', 'Unique identifier for a row', 'An index', 'A constraint'], correctAnswer: 'Unique identifier for a row', orderIndex: 6 },
        { testId: `test-${sqlSkill.id}`, questionText: 'Which command adds new rows?', options: ['UPDATE', 'INSERT', 'CREATE', 'ALTER'], correctAnswer: 'INSERT', orderIndex: 7 },
        { testId: `test-${sqlSkill.id}`, questionText: 'What does DISTINCT do?', options: ['Sorts results', 'Removes duplicates', 'Filters null', 'Joins tables'], correctAnswer: 'Removes duplicates', orderIndex: 8 },
        { testId: `test-${sqlSkill.id}`, questionText: 'Which clause sorts results?', options: ['GROUP BY', 'HAVING', 'ORDER BY', 'WHERE'], correctAnswer: 'ORDER BY', orderIndex: 9 },
        { testId: `test-${sqlSkill.id}`, questionText: 'What is a FOREIGN KEY?', options: ['Primary identifier', 'Reference to another table', 'An index', 'A function'], correctAnswer: 'Reference to another table', orderIndex: 10 },
    ] : [];

    const allQuestions = [...jsQuestions, ...pyQuestions, ...reactQuestions, ...sqlQuestions];

    for (const q of allQuestions) {
        await prisma.testQuestion.upsert({
            where: { id: `q-${q.testId}-${q.orderIndex}` },
            update: { questionText: q.questionText, options: q.options, correctAnswer: q.correctAnswer },
            create: { id: `q-${q.testId}-${q.orderIndex}`, ...q },
        });
    }
    console.log(`✅ Seeded ${allQuestions.length} test questions`);

    // Seed subscription plans (Phase 4)
    const subscriptionPlans = [
        {
            name: 'free',
            displayName: 'Free',
            priceMonthly: 0,
            priceYearly: 0,
            features: {
                resumeReviews: 3,
                interviews: 1,
                skillTests: 3,
                jobAlerts: false,
                prioritySupport: false,
            },
            sortOrder: 0,
        },
        {
            name: 'starter',
            displayName: 'Starter',
            priceMonthly: 299,
            priceYearly: 2499,
            features: {
                resumeReviews: 15,
                interviews: 5,
                skillTests: 10,
                jobAlerts: true,
                prioritySupport: false,
            },
            sortOrder: 1,
        },
        {
            name: 'pro',
            displayName: 'Pro',
            priceMonthly: 799,
            priceYearly: 6999,
            features: {
                resumeReviews: 'unlimited',
                interviews: 20,
                skillTests: 'unlimited',
                jobAlerts: true,
                prioritySupport: true,
            },
            sortOrder: 2,
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            priceMonthly: 1999,
            priceYearly: 17999,
            features: {
                resumeReviews: 'unlimited',
                interviews: 'unlimited',
                skillTests: 'unlimited',
                jobAlerts: true,
                prioritySupport: true,
                apiAccess: true,
            },
            sortOrder: 3,
        },
    ];

    for (const plan of subscriptionPlans) {
        await prisma.subscriptionPlan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
    }
    console.log(`✅ Seeded ${subscriptionPlans.length} subscription plans`);

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

