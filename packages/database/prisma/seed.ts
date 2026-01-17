import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Seed Admin User
    // Hash for 'Admin123!'
    const adminPassword = '$2a$12$P2NRBlMlP1LdUwn7fSMlZuByDd8YVmHCwuLiqsZjnVpV4OLO53bQ9m';
    const admin = await prisma.user.upsert({
        where: { email: 'admin@smartcareer.ai' },
        update: {
            role: 'ADMIN',
            passwordHash: adminPassword,
        },
        create: {
            email: 'admin@smartcareer.ai',
            passwordHash: adminPassword,
            name: 'System Administrator',
            role: 'ADMIN',
            isVerified: true,
        },
    });
    console.log(`✅ Seeded Admin User: ${admin.id}`);

    // Seed Recruiter User
    // Hash for 'Recruiter123!'
    const recruiterPassword = '$2a$12$MUSSnTpVxcQq7s5Pn6TwUuVl2C39jCavitzzk0FksuCkiP3c45Hire';
    const recruiter = await prisma.user.upsert({
        where: { email: 'recruiter@techhunters.io' },
        update: {
            role: 'RECRUITER',
            passwordHash: recruiterPassword,
        },
        create: {
            email: 'recruiter@techhunters.io',
            passwordHash: recruiterPassword,
            name: 'Tech Recruiter',
            role: 'RECRUITER',
            isVerified: true,
            recruiterProfile: {
                create: {
                    companyName: 'TechHunters Inc.',
                    industry: 'Staffing & Recruiting',
                    location: 'San Francisco, CA',
                    isVerified: true,
                }
            }
        },
    });
    console.log(`✅ Seeded Recruiter User: ${recruiter.id}`);

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
        // Data Analyst Skills
        { name: 'Excel', category: 'Tool', demandScore: 90 },
        { name: 'Statistics', category: 'Data', demandScore: 85 },
        { name: 'Tableau', category: 'Tool', demandScore: 88 },
        { name: 'Power BI', category: 'Tool', demandScore: 87 },
        { name: 'R', category: 'Programming', demandScore: 80 },
        { name: 'Pandas', category: 'Data', demandScore: 92 },
        { name: 'Data Visualization', category: 'Data', demandScore: 88 },
        { name: 'Data Modeling', category: 'Data', demandScore: 85 },
        { name: 'Artificial Intelligence', category: 'AI', demandScore: 90 },
    ];

    for (const skill of skills) {
        await prisma.skill.upsert({
            where: { name: skill.name },
            update: skill,
            create: skill,
        });
    }
    console.log(`✅ Seeded ${skills.length} skills`);

    // Fetch ALL skills to generate tests for them
    const allSkills = await prisma.skill.findMany();

    // Seed skill tests (Basic, Medium, Hard)
    const skillTests: any[] = [];

    const addTestsForSkill = (skill: any, name: string) => {
        if (!skill) return;
        skillTests.push(
            { skillId: skill.id, title: `${name} Basics`, description: `${name} Fundamentals`, difficulty: Difficulty.EASY, durationMinutes: 10, passingScore: 80, questionsCount: 5 },
            { skillId: skill.id, title: `${name} Intermediate`, description: `Intermediate ${name}`, difficulty: Difficulty.MEDIUM, durationMinutes: 20, passingScore: 70, questionsCount: 10 },
            { skillId: skill.id, title: `${name} Advanced`, description: `Advanced ${name} Concepts`, difficulty: Difficulty.HARD, durationMinutes: 30, passingScore: 70, questionsCount: 15 }
        );
    };

    // Generate tests for ALL skills
    for (const skill of allSkills) {
        addTestsForSkill(skill, skill.name);
    }

    for (const testData of skillTests) {
        if (!testData.skillId) continue;

        const testId = `test-${testData.skillId}-${testData.difficulty}`;
        await prisma.skillTest.upsert({
            where: { id: testId },
            update: testData,
            create: { id: testId, ...testData },
        });
    }
    console.log(`✅ Seeded ${skillTests.length} skill tests`);

    // Helper to seed questions for a test
    const seedQuestionsForTest = async (testId: string, questions: any[]) => {
        for (const q of questions) {
            await prisma.testQuestion.upsert({
                where: { id: `q-${testId}-${q.orderIndex}` },
                update: { questionText: q.questionText, options: q.options, correctAnswer: q.correctAnswer, testId },
                create: { id: `q-${testId}-${q.orderIndex}`, ...q, testId },
            });
        }
    };

    // Generic questions for Easy/Hard if specific ones aren't defined
    const getGenericQuestions = (skillName: string, level: string) => [
        { questionText: `Sample ${level} question 1 for ${skillName}?`, options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', orderIndex: 1 },
        { questionText: `Sample ${level} question 2 for ${skillName}?`, options: ['True', 'False'], correctAnswer: 'True', orderIndex: 2 },
        { questionText: `Sample ${level} question 3 for ${skillName}?`, options: ['Yes', 'No'], correctAnswer: 'Yes', orderIndex: 3 },
    ];

    // Specific questions
    const questionBank: Record<string, any[]> = {
        'JavaScript': [
            { questionText: 'What is the output of: typeof null?', options: ['null', 'undefined', 'object', 'number'], correctAnswer: 'object', orderIndex: 1 },
            { questionText: 'Which method adds an element to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 'push()', orderIndex: 2 },
            { questionText: 'What does === mean in JavaScript?', options: ['Assignment', 'Equality', 'Strict equality', 'Comparison'], correctAnswer: 'Strict equality', orderIndex: 3 },
            { questionText: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const', 'Both let and const'], correctAnswer: 'Both let and const', orderIndex: 4 },
            { questionText: 'What is a closure in JavaScript?', options: ['A loop', 'A function with access to outer scope', 'An object', 'An error'], correctAnswer: 'A function with access to outer scope', orderIndex: 5 },
            { questionText: 'Which method converts JSON string to object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.object()'], correctAnswer: 'JSON.parse()', orderIndex: 6 },
            { questionText: 'What does async/await handle?', options: ['Loops', 'Promises', 'Objects', 'Arrays'], correctAnswer: 'Promises', orderIndex: 7 },
            { questionText: 'Which is NOT a JavaScript data type?', options: ['string', 'boolean', 'float', 'symbol'], correctAnswer: 'float', orderIndex: 8 },
            { questionText: 'What is the spread operator?', options: ['...', '..', '***', '+++'], correctAnswer: '...', orderIndex: 9 },
            { questionText: 'Which method creates a new array with filtered elements?', options: ['map()', 'filter()', 'reduce()', 'forEach()'], correctAnswer: 'filter()', orderIndex: 10 },
        ],
        'Python': [
            { questionText: 'How do you create a list in Python?', options: ['{}', '[]', '()', '<>'], correctAnswer: '[]', orderIndex: 1 },
            { questionText: 'What keyword defines a function?', options: ['function', 'def', 'func', 'define'], correctAnswer: 'def', orderIndex: 2 },
            { questionText: 'Which is used for comments in Python?', options: ['//', '/* */', '#', '--'], correctAnswer: '#', orderIndex: 3 },
            { questionText: 'What is the output of: 3 ** 2?', options: ['6', '9', '5', '1'], correctAnswer: '9', orderIndex: 4 },
            { questionText: 'Which method adds an item to a list?', options: ['add()', 'append()', 'push()', 'insert()'], correctAnswer: 'append()', orderIndex: 5 },
            { questionText: 'What is a dictionary in Python?', options: ['Ordered list', 'Key-value pairs', 'Tuple', 'Set'], correctAnswer: 'Key-value pairs', orderIndex: 6 },
            { questionText: 'How do you start a for loop?', options: ['for i in range():', 'for (i=0):', 'for i:', 'loop i in:'], correctAnswer: 'for i in range():', orderIndex: 7 },
            { questionText: 'What does len() return?', options: ['Type', 'Length', 'Sum', 'Index'], correctAnswer: 'Length', orderIndex: 8 },
            { questionText: 'Which keyword is used for exception handling?', options: ['catch', 'try', 'except', 'Both try and except'], correctAnswer: 'Both try and except', orderIndex: 9 },
            { questionText: 'What is self in a class method?', options: ['A keyword', 'Reference to instance', 'A variable', 'A function'], correctAnswer: 'Reference to instance', orderIndex: 10 },
        ],
        'React': [
            { questionText: 'What is JSX?', options: ['A JavaScript library', 'Syntax extension for JavaScript', 'A CSS framework', 'A database'], correctAnswer: 'Syntax extension for JavaScript', orderIndex: 1 },
            { questionText: 'Which hook manages state in functional components?', options: ['useEffect', 'useState', 'useContext', 'useRef'], correctAnswer: 'useState', orderIndex: 2 },
            { questionText: 'What does useEffect do?', options: ['Manages state', 'Handles side effects', 'Creates context', 'Optimizes rendering'], correctAnswer: 'Handles side effects', orderIndex: 3 },
            { questionText: 'How do you pass data to a child component?', options: ['State', 'Props', 'Context', 'Refs'], correctAnswer: 'Props', orderIndex: 4 },
            { questionText: 'What is the Virtual DOM?', options: ['The actual DOM', 'A lightweight copy of the DOM', 'A CSS framework', 'A database'], correctAnswer: 'A lightweight copy of the DOM', orderIndex: 5 },
            { questionText: 'Which method renders a React component?', options: ['React.render()', 'ReactDOM.render()', 'Component.render()', 'App.render()'], correctAnswer: 'ReactDOM.render()', orderIndex: 6 },
            { questionText: 'What is the purpose of keys in React lists?', options: ['Styling', 'Unique identification', 'Event handling', 'State management'], correctAnswer: 'Unique identification', orderIndex: 7 },
            { questionText: 'How do you create a React app?', options: ['npm init react', 'npx create-react-app', 'npm react-new', 'create react-app'], correctAnswer: 'npx create-react-app', orderIndex: 8 },
            { questionText: 'What is a React Fragment?', options: ['A component without DOM node', 'A style component', 'An error boundary', 'A hook'], correctAnswer: 'A component without DOM node', orderIndex: 9 },
            { questionText: 'Which hook shares data between components?', options: ['useState', 'useEffect', 'useContext', 'useMemo'], correctAnswer: 'useContext', orderIndex: 10 },
        ],
        'SQL': [
            { questionText: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'], correctAnswer: 'Structured Query Language', orderIndex: 1 },
            { questionText: 'Which clause filters rows?', options: ['SELECT', 'FROM', 'WHERE', 'ORDER BY'], correctAnswer: 'WHERE', orderIndex: 2 },
            { questionText: 'Which JOIN returns all rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correctAnswer: 'FULL OUTER JOIN', orderIndex: 3 },
            { questionText: 'What does GROUP BY do?', options: ['Sorts results', 'Groups rows with same values', 'Filters rows', 'Joins tables'], correctAnswer: 'Groups rows with same values', orderIndex: 4 },
            { questionText: 'Which function counts rows?', options: ['SUM()', 'COUNT()', 'AVG()', 'MAX()'], correctAnswer: 'COUNT()', orderIndex: 5 },
            { questionText: 'What is a PRIMARY KEY?', options: ['A foreign reference', 'Unique identifier for a row', 'An index', 'A constraint'], correctAnswer: 'Unique identifier for a row', orderIndex: 6 },
            { questionText: 'Which command adds new rows?', options: ['UPDATE', 'INSERT', 'CREATE', 'ALTER'], correctAnswer: 'INSERT', orderIndex: 7 },
            { questionText: 'What does DISTINCT do?', options: ['Sorts results', 'Removes duplicates', 'Filters null', 'Joins tables'], correctAnswer: 'Removes duplicates', orderIndex: 8 },
            { questionText: 'Which clause sorts results?', options: ['GROUP BY', 'HAVING', 'ORDER BY', 'WHERE'], correctAnswer: 'ORDER BY', orderIndex: 9 },
            { questionText: 'What is a FOREIGN KEY?', options: ['Primary identifier', 'Reference to another table', 'An index', 'A function'], correctAnswer: 'Reference to another table', orderIndex: 10 },
        ],
        'Excel': [
            { questionText: 'Which function is used to find the highest number in a range?', options: ['MAX()', 'HIGH()', 'UPPER()', 'TOP()'], correctAnswer: 'MAX()', orderIndex: 1 },
            { questionText: 'What does VLOOKUP stand for?', options: ['Vertical Lookup', 'Variable Lookup', 'Value Lookup', 'Vector Lookup'], correctAnswer: 'Vertical Lookup', orderIndex: 2 },
            { questionText: 'Which symbol starts a formula?', options: ['$', '#', '=', '&'], correctAnswer: '=', orderIndex: 3 },
            { questionText: 'What is a Pivot Table used for?', options: ['Data Entry', 'Data Summarization', 'Formatting', 'Printing'], correctAnswer: 'Data Summarization', orderIndex: 4 },
            { questionText: 'What is the intersection of a row and a column called?', options: ['Grid', 'Box', 'Cell', 'Point'], correctAnswer: 'Cell', orderIndex: 5 },
            { questionText: 'Which function calculates the average?', options: ['MEAN()', 'AVERAGE()', 'AVG()', 'MEDIAN()'], correctAnswer: 'AVERAGE()', orderIndex: 6 },
            { questionText: 'How do you absolute reference a cell?', options: ['$A$1', '#A#1', '@A@1', '&A&1'], correctAnswer: '$A$1', orderIndex: 7 },
            { questionText: 'What does CONCATENATE do?', options: ['Splits text', 'Joins text', 'Deletes text', 'Hides text'], correctAnswer: 'Joins text', orderIndex: 8 },
            { questionText: 'Which chart is best for showing trends over time?', options: ['Pie Chart', 'Bar Chart', 'Line Chart', 'Scatter Plot'], correctAnswer: 'Line Chart', orderIndex: 9 },
            { questionText: 'What is Conditional Formatting?', options: ['Changing cell format based on value', 'Deleting cells', 'Adding formulas', 'Sorting data'], correctAnswer: 'Changing cell format based on value', orderIndex: 10 },
        ],
        'Statistics': [
            { questionText: 'What is the mean?', options: ['The middle value', 'The most frequent value', 'The average', 'The range'], correctAnswer: 'The average', orderIndex: 1 },
            { questionText: 'What is the median?', options: ['The middle value', 'The average', 'The most frequent value', 'The difference'], correctAnswer: 'The middle value', orderIndex: 2 },
            { questionText: 'What does standard deviation measure?', options: ['Central tendency', 'Dispersion/Spread', 'Probability', 'Correlation'], correctAnswer: 'Dispersion/Spread', orderIndex: 3 },
            { questionText: 'What is a p-value?', options: ['Probability of observing results by chance', 'The power of a test', 'The sample size', 'The mean'], correctAnswer: 'Probability of observing results by chance', orderIndex: 4 },
            { questionText: 'What is correlation?', options: ['Causation', 'Relationship between variables', 'Difference between means', 'Variance'], correctAnswer: 'Relationship between variables', orderIndex: 5 },
            { questionText: 'What is a null hypothesis?', options: ['The hypothesis to be tested (no effect)', 'The alternative hypothesis', 'The conclusion', 'The error rate'], correctAnswer: 'The hypothesis to be tested (no effect)', orderIndex: 6 },
            { questionText: 'Which distribution is "Bell Curve"?', options: ['Uniform', 'Binomial', 'Normal', 'Poisson'], correctAnswer: 'Normal', orderIndex: 7 },
            { questionText: 'What is statistical significance?', options: ['Importance of result', 'Unlikely to sample error', 'Large effect size', 'High correlation'], correctAnswer: 'Unlikely to sample error', orderIndex: 8 },
            { questionText: 'What is Type I error?', options: ['False Positive', 'False Negative', 'Correct rejection', 'Correct acceptance'], correctAnswer: 'False Positive', orderIndex: 9 },
            { questionText: 'What is regression used for?', options: ['Predicting values', 'Sorting data', 'Calculating mean', 'Plotting charts'], correctAnswer: 'Predicting values', orderIndex: 10 },
        ],
        'Tableau': [
            { questionText: 'What is a Dimension in Tableau?', options: ['Quantitative value', 'Categorical field', 'A calculation', 'A parameter'], correctAnswer: 'Categorical field', orderIndex: 1 },
            { questionText: 'What is a Measure in Tableau?', options: ['Categorical field', 'Quantitative numeric value', 'A map', 'A filter'], correctAnswer: 'Quantitative numeric value', orderIndex: 2 },
            { questionText: 'What file extension is a Tableau Workbook?', options: ['.twb', '.tde', '.hyper', '.tds'], correctAnswer: '.twb', orderIndex: 3 },
            { questionText: 'Which chart type is best for part-to-whole?', options: ['Bar', 'Line', 'Pie', 'Scatter'], correctAnswer: 'Pie', orderIndex: 4 },
            { questionText: 'What is a Dashboard?', options: ['A single chart', 'Collection of views', 'A data source', 'A calculation'], correctAnswer: 'Collection of views', orderIndex: 5 },
            { questionText: 'How do you filter data?', options: ['Drag to Filter shelf', 'Delete rows', 'Hide columns', 'Color codes'], correctAnswer: 'Drag to Filter shelf', orderIndex: 6 },
            { questionText: 'What is a Calculated Field?', options: ['Field created by formula', 'Field from database', 'A parameter', 'A group'], correctAnswer: 'Field created by formula', orderIndex: 7 },
            { questionText: 'What is a Story in Tableau?', options: ['Sequence of visualizations', 'A single sheet', 'A novel', 'A script'], correctAnswer: 'Sequence of visualizations', orderIndex: 8 },
            { questionText: 'What indicates a geographic field?', options: ['Globe icon', 'abc icon', '# icon', 'Calendar icon'], correctAnswer: 'Globe icon', orderIndex: 9 },
            { questionText: 'What is blending?', options: ['Mixing colors', 'Combining data from multiple sources', 'Filtering', 'Sorting'], correctAnswer: 'Combining data from multiple sources', orderIndex: 10 },
        ],
        'Power BI': [
            { questionText: 'What language is used for formulas in Power BI?', options: ['SQL', 'DAX', 'Python', 'Java'], correctAnswer: 'DAX', orderIndex: 1 },
            { questionText: 'What is Power Query used for?', options: ['Data Transformation', 'Visualization', 'Reporting', 'Sharing'], correctAnswer: 'Data Transformation', orderIndex: 2 },
            { questionText: 'What does DAX stand for?', options: ['Data Analysis Expressions', 'Data Access XML', 'Dynamic Analysis X', 'Database Auto Exchange'], correctAnswer: 'Data Analysis Expressions', orderIndex: 3 },
            { questionText: 'What is a Slicer?', options: ['A visual filter', 'A chart type', 'A data source', 'A theme'], correctAnswer: 'A visual filter', orderIndex: 4 },
            { questionText: 'Which view is used to manage relationships?', options: ['Report View', 'Data View', 'Model View', 'Query View'], correctAnswer: 'Model View', orderIndex: 5 },
            { questionText: 'What is a Measure in Power BI?', options: ['Static value', 'Calculation performed on aggregate', 'A column', 'A table'], correctAnswer: 'Calculation performed on aggregate', orderIndex: 6 },
            { questionText: 'What file extension is a Power BI file?', options: ['.pbix', '.pbi', '.pbx', '.power'], correctAnswer: '.pbix', orderIndex: 7 },
            { questionText: 'What is the Report Canvas?', options: ['Where you create visuals', 'Where you write code', 'Where you edit data', 'Where you manage users'], correctAnswer: 'Where you create visuals', orderIndex: 8 },
            { questionText: 'Can you use Python visuals in Power BI?', options: ['Yes', 'No', 'Only R', 'Only SQL'], correctAnswer: 'Yes', orderIndex: 9 },
            { questionText: 'What is Row-Level Security?', options: ['Restricting data based on user roles', 'Locking rows', 'Hiding columns', 'Encrypting data'], correctAnswer: 'Restricting data based on user roles', orderIndex: 10 },
        ],
        'R': [
            { questionText: 'What operator assigns a value in R?', options: ['=', '<-', '->', '=='], correctAnswer: '<-', orderIndex: 1 },
            { questionText: 'Which function creates a vector?', options: ['v()', 'c()', 'vec()', 'create()'], correctAnswer: 'c()', orderIndex: 2 },
            { questionText: 'What is a DataFrame?', options: ['A 2D structure like a table', 'A list', 'A matrix', 'A graph'], correctAnswer: 'A 2D structure like a table', orderIndex: 3 },
            { questionText: 'Which library is popular for plotting?', options: ['ggplot2', 'matplotlib', 'seaborn', 'pandas'], correctAnswer: 'ggplot2', orderIndex: 4 },
            { questionText: 'How do you install a package?', options: ['install.packages()', 'get.package()', 'require()', 'library()'], correctAnswer: 'install.packages()', orderIndex: 5 },
            { questionText: 'What output does summary() give?', options: ['Statistical summary', 'First rows', 'Structure', 'Graph'], correctAnswer: 'Statistical summary', orderIndex: 6 },
            { questionText: 'What symbol accesses lines in a DataFrame?', options: ['@', '$', '#', '&'], correctAnswer: '$', orderIndex: 7 },
            { questionText: 'What is shiny used for?', options: ['Web apps', 'Machine learning', 'Database', 'Cleanup'], correctAnswer: 'Web apps', orderIndex: 8 },
            { questionText: 'Which is NOT a data type in R?', options: ['numeric', 'character', 'logical', 'dictionary'], correctAnswer: 'dictionary', orderIndex: 9 },
            { questionText: 'What does %>% mean?', options: ['Pipe operator', 'Greater than', 'Modulo', 'Comment'], correctAnswer: 'Pipe operator', orderIndex: 10 },
        ],
        'Pandas': [
            { questionText: 'What is the primary data structure in Pandas?', options: ['Series', 'DataFrame', 'List', 'Array'], correctAnswer: 'DataFrame', orderIndex: 1 },
            { questionText: 'How do you read a CSV file?', options: ['pd.read_csv()', 'pd.load_csv()', 'pd.csv()', 'pd.open()'], correctAnswer: 'pd.read_csv()', orderIndex: 2 },
            { questionText: 'Which method shows the first few rows?', options: ['head()', 'top()', 'start()', 'first()'], correctAnswer: 'head()', orderIndex: 3 },
            { questionText: 'How do you check for missing values?', options: ['isna()', 'missing()', 'null()', 'check()'], correctAnswer: 'isna()', orderIndex: 4 },
            { questionText: 'Which method drops missing values?', options: ['drop()', 'dropna()', 'remove()', 'delete()'], correctAnswer: 'dropna()', orderIndex: 5 },
            { questionText: 'How do you select a column "Age"?', options: ['df["Age"]', 'df(Age)', 'df.select("Age")', 'df.get("Age")'], correctAnswer: 'df["Age"]', orderIndex: 6 },
            { questionText: 'What does groupby() do?', options: ['Groups data', 'Sorts data', 'Filters data', 'Plots data'], correctAnswer: 'Groups data', orderIndex: 7 },
            { questionText: 'Which function gives statistical description?', options: ['describe()', 'stat()', 'summary()', 'info()'], correctAnswer: 'describe()', orderIndex: 8 },
            { questionText: 'How do you filter rows?', options: ['df[df["Age"] > 20]', 'df.filter("Age" > 20)', 'df.where("Age" > 20)', 'df.select("Age" > 20)'], correctAnswer: 'df[df["Age"] > 20]', orderIndex: 9 },
            { questionText: 'What is loc used for?', options: ['Label-based indexing', 'Integer-based indexing', 'Sorting', 'Merging'], correctAnswer: 'Label-based indexing', orderIndex: 10 },
        ],
        'Git': [
            { questionText: 'Which command initializes a repository?', options: ['git init', 'git start', 'git new', 'git create'], correctAnswer: 'git init', orderIndex: 1 },
            { questionText: 'How do you stage files?', options: ['git add', 'git stage', 'git commit', 'git push'], correctAnswer: 'git add', orderIndex: 2 },
            { questionText: 'How do you save changes?', options: ['git save', 'git commit', 'git store', 'git lock'], correctAnswer: 'git commit', orderIndex: 3 },
            { questionText: 'Which command downloads from remote?', options: ['git pull', 'git push', 'git down', 'git get'], correctAnswer: 'git pull', orderIndex: 4 },
            { questionText: 'What is a branch?', options: ['A parallel version of code', 'A bug', 'A folder', 'A server'], correctAnswer: 'A parallel version of code', orderIndex: 5 },
            { questionText: 'How do you merge branches?', options: ['git merge', 'git join', 'git combine', 'git mix'], correctAnswer: 'git merge', orderIndex: 6 },
            { questionText: 'What checks the status of files?', options: ['git status', 'git check', 'git info', 'git state'], correctAnswer: 'git status', orderIndex: 7 },
            { questionText: 'what is .gitignore?', options: ['Files to ignore', 'Files to include', 'Settings', 'Log file'], correctAnswer: 'Files to ignore', orderIndex: 8 },
            { questionText: 'What is HEAD?', options: ['The current commit', 'The first commit', 'The main branch', 'The server'], correctAnswer: 'The current commit', orderIndex: 9 },
            { questionText: 'How do you view history?', options: ['git log', 'git history', 'git timeline', 'git past'], correctAnswer: 'git log', orderIndex: 10 },
        ],
        'Node.js': [
            { questionText: 'What is Node.js?', options: ['A framework', 'A JS runtime', 'A database', 'A language'], correctAnswer: 'A JS runtime', orderIndex: 1 },
            { questionText: 'Which module handles file I/O?', options: ['fs', 'http', 'path', 'os'], correctAnswer: 'fs', orderIndex: 2 },
            { questionText: 'What is the package manager for Node?', options: ['npm', 'npx', 'node-pkg', 'yarn'], correctAnswer: 'npm', orderIndex: 3 },
            { questionText: 'What is the Event Loop?', options: ['Handling async callbacks', 'A for loop', 'A database query', 'An error handler'], correctAnswer: 'Handling async callbacks', orderIndex: 4 },
            { questionText: 'Which framework is built on Node?', options: ['Django', 'Laravel', 'Express', 'Spring'], correctAnswer: 'Express', orderIndex: 5 },
            { questionText: 'How do you export a module?', options: ['module.exports', 'export default', 'exports.module', 'return module'], correctAnswer: 'module.exports', orderIndex: 6 },
            { questionText: 'What is a Stream?', options: ['Data handling method', 'A video', 'A database', 'A loop'], correctAnswer: 'Data handling method', orderIndex: 7 },
            { questionText: 'Which object is global in Node?', options: ['window', 'files', 'process', 'document'], correctAnswer: 'process', orderIndex: 8 },
            { questionText: 'What manages dependencies?', options: ['package.json', 'node_modules', 'index.js', 'npm.log'], correctAnswer: 'package.json', orderIndex: 9 },
            { questionText: 'What is middleware?', options: ['Software glue', 'Hardware', 'Database', 'Frontend'], correctAnswer: 'Software glue', orderIndex: 10 },
        ],
        'TypeScript': [
            { questionText: 'What is TypeScript?', options: ['Superset of JS', 'New language', 'Database', 'Framework'], correctAnswer: 'Superset of JS', orderIndex: 1 },
            { questionText: 'How do you define a type?', options: ['type X = {}', 'def X', 'var X', 'class X'], correctAnswer: 'type X = {}', orderIndex: 2 },
            { questionText: 'What is an Interface?', options: ['Contract for object shape', 'A class', 'A function', 'A variable'], correctAnswer: 'Contract for object shape', orderIndex: 3 },
            { questionText: 'Does TypeScript run in the browser?', options: ['No, it transpiles', 'Yes directly', 'Only in Chrome', 'Only with React'], correctAnswer: 'No, it transpiles', orderIndex: 4 },
            { questionText: 'What is "any" type?', options: ['Disable type checking', 'A string', 'A number', 'An object'], correctAnswer: 'Disable type checking', orderIndex: 5 },
            { questionText: 'What file extension is used?', options: ['.ts', '.js', '.jsx', '.tsx'], correctAnswer: '.ts', orderIndex: 6 },
            { questionText: 'How to make a property optional?', options: ['prop?', 'prop!', 'optional prop', '*prop'], correctAnswer: 'prop?', orderIndex: 7 },
            { questionText: 'What is a Generic?', options: ['Reusable component type', 'A function', 'A class', 'A variable'], correctAnswer: 'Reusable component type', orderIndex: 8 },
            { questionText: 'Can you use JS libraries in TS?', options: ['Yes', 'No', 'Only React', 'Only Node'], correctAnswer: 'Yes', orderIndex: 9 },
            { questionText: 'What is a Union Type?', options: ['Value can be A or B', 'Joining strings', 'Merging arrays', 'A class'], correctAnswer: 'Value can be A or B', orderIndex: 10 },
        ],
        'AWS': [
            { questionText: 'What is EC2?', options: ['Virtual server', 'Storage', 'Database', 'DNS'], correctAnswer: 'Virtual server', orderIndex: 1 },
            { questionText: 'What is S3?', options: ['Object storage', 'Server', 'Database', 'Queue'], correctAnswer: 'Object storage', orderIndex: 2 },
            { questionText: 'What is Lambda?', options: ['Serverless compute', 'Database', 'Storage', 'Network'], correctAnswer: 'Serverless compute', orderIndex: 3 },
            { questionText: 'What defines infrastructure as code?', options: ['CloudFormation', 'EC2', 'S3', 'IAM'], correctAnswer: 'CloudFormation', orderIndex: 4 },
            { questionText: 'What service manages users?', options: ['IAM', 'EC2', 'S3', 'RDS'], correctAnswer: 'IAM', orderIndex: 5 },
            { questionText: 'What is RDS?', options: ['Relational Database Service', 'Remote Data Server', 'Raw Data Storage', 'Realtime Data System'], correctAnswer: 'Relational Database Service', orderIndex: 6 },
            { questionText: 'What connects VPCs?', options: ['Peering', 'Connecting', 'Linking', 'Joining'], correctAnswer: 'Peering', orderIndex: 7 },
            { questionText: 'What is CloudWatch?', options: ['Monitoring service', 'Storage', 'Compute', 'Database'], correctAnswer: 'Monitoring service', orderIndex: 8 },
            { questionText: 'What is a Region?', options: ['Geographic area', 'A city', 'A building', 'A server'], correctAnswer: 'Geographic area', orderIndex: 9 },
            { questionText: 'What is Auto Scaling?', options: ['Adjusting capacity automatically', 'manual resizing', 'fixed size', 'database index'], correctAnswer: 'Adjusting capacity automatically', orderIndex: 10 },
        ],
        'Docker': [
            { questionText: 'What is a container?', options: ['Isolated execution env', 'A virtual machine', 'A folder', 'A disk'], correctAnswer: 'Isolated execution env', orderIndex: 1 },
            { questionText: 'What creates a docker image?', options: ['Dockerfile', 'Imagefile', 'Buildfile', 'Containerfile'], correctAnswer: 'Dockerfile', orderIndex: 2 },
            { questionText: 'Which command lists containers?', options: ['docker ps', 'docker list', 'docker show', 'docker ls'], correctAnswer: 'docker ps', orderIndex: 3 },
            { questionText: 'What downloads images?', options: ['docker pull', 'docker get', 'docker fetch', 'docker down'], correctAnswer: 'docker pull', orderIndex: 4 },
            { questionText: 'What is Docker Compose?', options: ['Multi-container tool', 'Image builder', 'Network tool', 'Storage tool'], correctAnswer: 'Multi-container tool', orderIndex: 5 },
            { questionText: 'Where are images stored?', options: ['Registry', 'Folder', 'Database', 'Cloud'], correctAnswer: 'Registry', orderIndex: 6 },
            { questionText: 'What command removes a container?', options: ['docker rm', 'docker del', 'docker remove', 'docker kill'], correctAnswer: 'docker rm', orderIndex: 7 },
            { questionText: 'What is a Volume?', options: ['Persistent data storage', 'Sound level', 'Network speed', 'CPU usage'], correctAnswer: 'Persistent data storage', orderIndex: 8 },
            { questionText: 'What is the default registry?', options: ['Docker Hub', 'GitHub', 'AWS', 'Google'], correctAnswer: 'Docker Hub', orderIndex: 9 },
            { questionText: 'Which flag runs detached?', options: ['-d', '-r', '-a', '-x'], correctAnswer: '-d', orderIndex: 10 },
        ],
        'Kubernetes': [
            { questionText: 'What is a Pod?', options: ['Smallest deployable unit', 'A container', 'A server', 'A volume'], correctAnswer: 'Smallest deployable unit', orderIndex: 1 },
            { questionText: 'What manages the cluster?', options: ['Master/Control Plane', 'Worker Node', 'Pod', 'Service'], correctAnswer: 'Master/Control Plane', orderIndex: 2 },
            { questionText: 'Which tool interacts with K8s?', options: ['kubectl', 'k8s-cli', 'kube-tool', 'docker'], correctAnswer: 'kubectl', orderIndex: 3 },
            { questionText: 'What is a Service?', options: ['Network abstraction', 'A pod', 'A volume', 'A deployment'], correctAnswer: 'Network abstraction', orderIndex: 4 },
            { questionText: 'What defines desired state?', options: ['YAML Manifest', 'JSON file', 'Text file', 'Script'], correctAnswer: 'YAML Manifest', orderIndex: 5 },
            { questionText: 'What is a ReplicaSet?', options: ['Ensures pod count', 'Data copy', 'Network set', 'Storage set'], correctAnswer: 'Ensures pod count', orderIndex: 6 },
            { questionText: 'What is a Namespace?', options: ['Logical cluster partition', 'A name', 'A file', 'A tag'], correctAnswer: 'Logical cluster partition', orderIndex: 7 },
            { questionText: 'What is Minikube?', options: ['Local K8s cluster', 'Small pod', 'Mini container', 'Network tool'], correctAnswer: 'Local K8s cluster', orderIndex: 8 },
            { questionText: 'What is Ingress?', options: ['External access to services', 'Internal network', 'Storage', 'Compute'], correctAnswer: 'External access to services', orderIndex: 9 },
            { questionText: 'What is Helm?', options: ['Package manager', 'Ship wheel', 'Network tool', 'Monitor'], correctAnswer: 'Package manager', orderIndex: 10 },
        ],
        'Java': [
            { questionText: 'What is the JVM?', options: ['Java Virtual Machine', 'Java Visual Mode', 'Java Variable Manager', 'Java Video Maker'], correctAnswer: 'Java Virtual Machine', orderIndex: 1 },
            { questionText: 'Which keyword inherits a class?', options: ['extends', 'implements', 'inherits', 'uses'], correctAnswer: 'extends', orderIndex: 2 },
            { questionText: 'What is an Interface?', options: ['Abstract type', 'A class', 'A variable', 'A loop'], correctAnswer: 'Abstract type', orderIndex: 3 },
            { questionText: 'What is the entry point?', options: ['public static void main', 'start()', 'init()', 'run()'], correctAnswer: 'public static void main', orderIndex: 4 },
            { questionText: 'Are strings mutable?', options: ['No', 'Yes', 'Sometimes', 'Only generic'], correctAnswer: 'No', orderIndex: 5 },
            { questionText: 'What manages memory?', options: ['Garbage Collector', 'Programmer', 'OS', 'CPU'], correctAnswer: 'Garbage Collector', orderIndex: 6 },
            { questionText: 'Which collection has unique items?', options: ['Set', 'List', 'Map', 'Array'], correctAnswer: 'Set', orderIndex: 7 },
            { questionText: 'What is overloading?', options: ['Same name diff parameters', 'Same name same parameters', 'Overriding', 'Hiding'], correctAnswer: 'Same name diff parameters', orderIndex: 8 },
            { questionText: 'What is a package?', options: ['Group of classes', 'A box', 'A variable', 'A function'], correctAnswer: 'Group of classes', orderIndex: 9 },
            { questionText: 'Which is NOT a primitive?', options: ['String', 'int', 'boolean', 'char'], correctAnswer: 'String', orderIndex: 10 },
        ],
        'CSS': [
            { questionText: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Colorful Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets'], correctAnswer: 'Cascading Style Sheets', orderIndex: 1 },
            { questionText: 'How do you select an ID?', options: ['#id', '.id', '*id', 'id'], correctAnswer: '#id', orderIndex: 2 },
            { questionText: 'Which property changes text color?', options: ['color', 'text-color', 'font-color', 'fg-color'], correctAnswer: 'color', orderIndex: 3 },
            { questionText: 'How do you center a div?', options: ['margin: 0 auto', 'text-align: center', 'float: center', 'align: center'], correctAnswer: 'margin: 0 auto', orderIndex: 4 },
            { questionText: 'What is Flexbox?', options: ['Layout module', 'A style', 'A color', 'A font'], correctAnswer: 'Layout module', orderIndex: 5 },
            { questionText: 'Which tag links CSS?', options: ['<link>', '<style>', '<css>', '<script>'], correctAnswer: '<link>', orderIndex: 6 },
            { questionText: 'What is z-index?', options: ['Stack order', 'Zoom level', 'Zero index', 'Zone'], correctAnswer: 'Stack order', orderIndex: 7 },
            { questionText: 'What is 1rem?', options: ['Root element font size', '1 pixel', '10 pixels', 'Parent font size'], correctAnswer: 'Root element font size', orderIndex: 8 },
            { questionText: 'How to make text bold?', options: ['font-weight: bold', 'text-style: bold', 'font: bold', 'style: bold'], correctAnswer: 'font-weight: bold', orderIndex: 9 },
            { questionText: 'What is the Box Model?', options: ['Margin, Border, Padding, Content', 'Box sizing', 'Layout', 'Grid'], correctAnswer: 'Margin, Border, Padding, Content', orderIndex: 10 },
        ],
        'REST APIs': [
            { questionText: 'What does REST stand for?', options: ['Representational State Transfer', 'Remote State Transfer', 'Real State Transfer', 'Rapid State Transfer'], correctAnswer: 'Representational State Transfer', orderIndex: 1 },
            { questionText: 'Which method retrieves data?', options: ['GET', 'POST', 'PUT', 'DELETE'], correctAnswer: 'GET', orderIndex: 2 },
            { questionText: 'Which method creates data?', options: ['POST', 'GET', 'PUT', 'DELETE'], correctAnswer: 'POST', orderIndex: 3 },
            { questionText: 'What is a 200 status code?', options: ['OK', 'Error', 'Not Found', 'Created'], correctAnswer: 'OK', orderIndex: 4 },
            { questionText: 'What is a 404 status code?', options: ['Not Found', 'OK', 'Error', 'Forbidden'], correctAnswer: 'Not Found', orderIndex: 5 },
            { questionText: 'What format is common for data?', options: ['JSON', 'XML', 'HTML', 'CSV'], correctAnswer: 'JSON', orderIndex: 6 },
            { questionText: 'What is an endpoint?', options: ['URL for a resource', 'A server', 'A database', 'A file'], correctAnswer: 'URL for a resource', orderIndex: 7 },
            { questionText: 'What is authentication?', options: ['Verifying identity', 'Encrypting data', 'Compressing files', 'Sending email'], correctAnswer: 'Verifying identity', orderIndex: 8 },
            { questionText: 'Which header sends a token?', options: ['Authorization', 'Authentication', 'Token', 'Key'], correctAnswer: 'Authorization', orderIndex: 9 },
            { questionText: 'What is idempotency?', options: ['Same result multiple calls', 'Fast response', 'Secure call', 'Error handling'], correctAnswer: 'Same result multiple calls', orderIndex: 10 },
        ],
        'MongoDB': [
            { questionText: 'What type of database is MongoDB?', options: ['NoSQL', 'SQL', 'Graph', 'Key-Value'], correctAnswer: 'NoSQL', orderIndex: 1 },
            { questionText: 'What stores data?', options: ['Documents', 'Tables', 'Rows', 'Sheets'], correctAnswer: 'Documents', orderIndex: 2 },
            { questionText: 'What format are documents?', options: ['BSON', 'JSON', 'XML', 'CSV'], correctAnswer: 'BSON', orderIndex: 3 },
            { questionText: 'Which method finds documents?', options: ['find()', 'select()', 'query()', 'get()'], correctAnswer: 'find()', orderIndex: 4 },
            { questionText: 'What is an _id?', options: ['Unique identifier', 'An index', 'A key', 'A name'], correctAnswer: 'Unique identifier', orderIndex: 5 },
            { questionText: 'What is a Collection?', options: ['Group of documents', 'A table', 'A database', 'A file'], correctAnswer: 'Group of documents', orderIndex: 6 },
            { questionText: 'How do you insert specific data?', options: ['insertOne()', 'add()', 'put()', 'create()'], correctAnswer: 'insertOne()', orderIndex: 7 },
            { questionText: 'What creates an index?', options: ['createIndex()', 'index()', 'addIndex()', 'makeIndex()'], correctAnswer: 'createIndex()', orderIndex: 8 },
            { questionText: 'What is Aggregation?', options: ['Data processing pipeline', 'Sorting', 'Filtering', 'Joining'], correctAnswer: 'Data processing pipeline', orderIndex: 9 },
            { questionText: 'Which is NOT a MongoDB tool?', options: ['MySQL Workbench', 'Compass', 'Shell', 'Atlas'], correctAnswer: 'MySQL Workbench', orderIndex: 10 },
        ],
        'PostgreSQL': [
            { questionText: 'What is PostgreSQL?', options: ['Relational Database', 'NoSQL', 'Graph DB', 'Key-Value Store'], correctAnswer: 'Relational Database', orderIndex: 1 },
            { questionText: 'What is pgAdmin?', options: ['Management Tool', 'A database', 'A server', 'A driver'], correctAnswer: 'Management Tool', orderIndex: 2 },
            { questionText: 'What stores JSON data?', options: ['JSONB', 'Text', 'Blob', 'Varchar'], correctAnswer: 'JSONB', orderIndex: 3 },
            { questionText: 'What handles concurrency?', options: ['MVCC', 'Locking', 'Blocking', 'Queuing'], correctAnswer: 'MVCC', orderIndex: 4 },
            { questionText: 'What is a Schema?', options: ['Logical container', 'A table', 'A database', 'A user'], correctAnswer: 'Logical container', orderIndex: 5 },
            { questionText: 'Which operator matches patterns?', options: ['LIKE', 'MATCH', 'IS', 'EQUALS'], correctAnswer: 'LIKE', orderIndex: 6 },
            { questionText: 'What is a foreign key?', options: ['Referential integriy', 'Primary key', 'Index', 'Data type'], correctAnswer: 'Referential integriy', orderIndex: 7 },
            { questionText: 'How to back up a DB?', options: ['pg_dump', 'backup', 'export', 'save'], correctAnswer: 'pg_dump', orderIndex: 8 },
            { questionText: 'What connects via CLI?', options: ['psql', 'postgres', 'cli', 'connect'], correctAnswer: 'psql', orderIndex: 9 },
            { questionText: 'What is an Index?', options: ['Faster lookup structure', 'A table', 'A primary key', 'A view'], correctAnswer: 'Faster lookup structure', orderIndex: 10 },
        ],
        'Linux': [
            { questionText: 'Which command lists files?', options: ['ls', 'list', 'dir', 'show'], correctAnswer: 'ls', orderIndex: 1 },
            { questionText: 'Which command changes directory?', options: ['cd', 'mv', 'cp', 'rm'], correctAnswer: 'cd', orderIndex: 2 },
            { questionText: 'What is root?', options: ['Superuser', 'A folder', 'A disk', 'A network'], correctAnswer: 'Superuser', orderIndex: 3 },
            { questionText: 'Which command shows current path?', options: ['pwd', 'cwd', 'path', 'where'], correctAnswer: 'pwd', orderIndex: 4 },
            { questionText: 'How to create a directory?', options: ['mkdir', 'newdir', 'create', 'md'], correctAnswer: 'mkdir', orderIndex: 5 },
            { questionText: 'What finds strings in files?', options: ['grep', 'find', 'search', 'locate'], correctAnswer: 'grep', orderIndex: 6 },
            { questionText: 'What changes permissions?', options: ['chmod', 'chown', 'perm', 'change'], correctAnswer: 'chmod', orderIndex: 7 },
            { questionText: 'What displays running processes?', options: ['top', 'list', 'proc', 'run'], correctAnswer: 'top', orderIndex: 8 },
            { questionText: 'Which symbol redirects output?', options: ['>', '<', '|', '&'], correctAnswer: '>', orderIndex: 9 },
            { questionText: 'What is Bash?', options: ['A shell', 'A game', 'A kernel', 'A text editor'], correctAnswer: 'A shell', orderIndex: 10 },
        ],
        'Machine Learning': [
            { questionText: 'What is supervised learning?', options: ['Labeled data training', 'Unlabeled data', 'Reward based', 'Clustering'], correctAnswer: 'Labeled data training', orderIndex: 1 },
            { questionText: 'What is unsupervised learning?', options: ['Unlabeled data training', 'Labeled data', 'Reward based', 'Regression'], correctAnswer: 'Unlabeled data training', orderIndex: 2 },
            { questionText: 'What fits a model?', options: ['Training', 'Testing', 'Validating', 'Predicting'], correctAnswer: 'Training', orderIndex: 3 },
            { questionText: 'What is overfitting?', options: ['Learning noise', 'Good generalization', 'Simple model', 'Underfitting'], correctAnswer: 'Learning noise', orderIndex: 4 },
            { questionText: 'What is a feature?', options: ['Input variable', 'Output variable', 'Target', 'Error'], correctAnswer: 'Input variable', orderIndex: 5 },
            { questionText: 'What is a label?', options: ['Target variable', 'Input variable', 'A tag', 'A type'], correctAnswer: 'Target variable', orderIndex: 6 },
            { questionText: 'What splits data?', options: ['Train-test split', 'Cut', 'Divide', 'Slice'], correctAnswer: 'Train-test split', orderIndex: 7 },
            { questionText: 'What measures accuracy?', options: ['Metric', 'Algorithm', 'Feature', 'Model'], correctAnswer: 'Metric', orderIndex: 8 },
            { questionText: 'What is classification?', options: ['Predicting category', 'Predicting number', 'Clustering', 'Reduction'], correctAnswer: 'Predicting category', orderIndex: 9 },
            { questionText: 'What is regression?', options: ['Predicting continuous value', 'Predicting label', 'Clustering', 'Grouping'], correctAnswer: 'Predicting continuous value', orderIndex: 10 },
        ],
        'TensorFlow': [
            { questionText: 'Who developed TensorFlow?', options: ['Google', 'Facebook', 'Amazon', 'Microsoft'], correctAnswer: 'Google', orderIndex: 1 },
            { questionText: 'What is a Tensor?', options: ['Multi-dimensional array', 'A number', 'A string', 'A list'], correctAnswer: 'Multi-dimensional array', orderIndex: 2 },
            { questionText: 'What API is high-level in TF?', options: ['Keras', 'Torch', 'SciKit', 'Pandas'], correctAnswer: 'Keras', orderIndex: 3 },
            { questionText: 'What is a Graph?', options: ['Computation steps', 'A chart', 'A plot', 'A circle'], correctAnswer: 'Computation steps', orderIndex: 4 },
            { questionText: 'What is TensorBoard?', options: ['Visualization tool', 'A dashboard', 'A keyboard', 'A screen'], correctAnswer: 'Visualization tool', orderIndex: 5 },
            { questionText: 'What runs a graph?', options: ['Session', 'Run', 'Execute', 'Start'], correctAnswer: 'Session', orderIndex: 6 },
            { questionText: 'What is a Variable?', options: ['Mutable state', 'Constant', 'Input', 'Output'], correctAnswer: 'Mutable state', orderIndex: 7 },
            { questionText: 'What is a Placeholder?', options: ['Input for graph', 'A variable', 'A constant', 'A tensor'], correctAnswer: 'Input for graph', orderIndex: 8 },
            { questionText: 'Where does TF run?', options: ['CPU and GPU', 'Only CPU', 'Only GPU', 'Only Cloud'], correctAnswer: 'CPU and GPU', orderIndex: 9 },
            { questionText: 'What handles automatic differentiation?', options: ['GradientTape', 'Diff', 'Calc', 'Auto'], correctAnswer: 'GradientTape', orderIndex: 10 },
        ],
        'PyTorch': [
            { questionText: 'Who developed PyTorch?', options: ['Facebook', 'Google', 'Amazon', 'Microsoft'], correctAnswer: 'Facebook', orderIndex: 1 },
            { questionText: 'What defines PyTorch?', options: ['Dynamic computational graph', 'Static graph', 'No graph', 'Slow execution'], correctAnswer: 'Dynamic computational graph', orderIndex: 2 },
            { questionText: 'What is a Tensor in PyTorch?', options: ['Multi-dimensional array', 'A number', 'A string', 'A list'], correctAnswer: 'Multi-dimensional array', orderIndex: 3 },
            { questionText: 'Which module builds networks?', options: ['torch.nn', 'torch.net', 'torch.ml', 'torch.ai'], correctAnswer: 'torch.nn', orderIndex: 4 },
            { questionText: 'What calculates gradients?', options: ['backward()', 'gradient()', 'calc()', 'diff()'], correctAnswer: 'backward()', orderIndex: 5 },
            { questionText: 'What moves tensors to GPU?', options: ['.to("cuda")', '.gpu()', '.move()', '.cuda()'], correctAnswer: '.to("cuda")', orderIndex: 6 },
            { questionText: 'What manages optimization?', options: ['torch.optim', 'torch.learn', 'torch.train', 'torch.run'], correctAnswer: 'torch.optim', orderIndex: 7 },
            { questionText: 'What handles datasets?', options: ['Dataset & DataLoader', 'DataHandler', 'DataMan', 'LoadData'], correctAnswer: 'Dataset & DataLoader', orderIndex: 8 },
            { questionText: 'What is Autograd?', options: ['Automatic differentiation', 'Auto grading', 'Auto graphing', 'Automation'], correctAnswer: 'Automatic differentiation', orderIndex: 9 },
            { questionText: 'Is PyTorch Pythonic?', options: ['Yes', 'No', 'Kind of', 'Not at all'], correctAnswer: 'Yes', orderIndex: 10 },
        ],
        'Agile': [
            { questionText: 'What is the Agile Manifesto?', options: ['Values for SW dev', 'A rule book', 'A contract', 'A plan'], correctAnswer: 'Values for SW dev', orderIndex: 1 },
            { questionText: 'What is a Sprint?', options: ['Time-boxed iteration', 'A race', 'A meeting', 'A backlog'], correctAnswer: 'Time-boxed iteration', orderIndex: 2 },
            { questionText: 'What is a User Story?', options: ['Feature description', 'A novel', 'A bug', 'A test'], correctAnswer: 'Feature description', orderIndex: 3 },
            { questionText: 'What is the Daily Standup?', options: ['Status meeting', 'A break', 'A report', 'A plan'], correctAnswer: 'Status meeting', orderIndex: 4 },
            { questionText: 'Who owns the product backlog?', options: ['Product Owner', 'Scrum Master', 'Developer', 'Manager'], correctAnswer: 'Product Owner', orderIndex: 5 },
            { questionText: 'What is Kanban?', options: ['Visual workflow method', 'A Japanese car', 'A city', 'A tool'], correctAnswer: 'Visual workflow method', orderIndex: 6 },
            { questionText: 'What is Velocity?', options: ['Measure of work done', 'Speed of code', 'Sprint length', 'Bug count'], correctAnswer: 'Measure of work done', orderIndex: 7 },
            { questionText: 'What is Retrospective?', options: ['Meeting to improve', 'Reviewing code', 'Testing', 'Planning'], correctAnswer: 'Meeting to improve', orderIndex: 8 },
            { questionText: 'What is an Epic?', options: ['Large body of work', 'A story', 'A task', 'A bug'], correctAnswer: 'Large body of work', orderIndex: 9 },
            { questionText: 'What prioritizes work?', options: ['Backlog', 'Email', 'Chat', 'Phone'], correctAnswer: 'Backlog', orderIndex: 10 },
        ],
        'Scrum': [
            { questionText: 'What is Scrum?', options: ['Agile framework', 'A bug tracker', 'A database', 'A language'], correctAnswer: 'Agile framework', orderIndex: 1 },
            { questionText: 'Who facilitates the process?', options: ['Scrum Master', 'Product Owner', 'Manager', 'Lead'], correctAnswer: 'Scrum Master', orderIndex: 2 },
            { questionText: 'How long is a Sprint usually?', options: ['2-4 weeks', '1 day', '6 months', '1 year'], correctAnswer: '2-4 weeks', orderIndex: 3 },
            { questionText: 'What are the 3 roles?', options: ['PO, SM, Team', 'Manager, Lead, Dev', 'Client, Boss, Worker', 'None'], correctAnswer: 'PO, SM, Team', orderIndex: 4 },
            { questionText: 'What defines "Done"?', options: ['Definition of Done', 'Code compiles', 'Manager says so', 'Time is up'], correctAnswer: 'Definition of Done', orderIndex: 5 },
            { questionText: 'What consists of the Sprint Backlog?', options: ['Tasks for the sprint', 'All requirements', 'Bugs only', 'Features only'], correctAnswer: 'Tasks for the sprint', orderIndex: 6 },
            { questionText: 'What happens at Sprint Review?', options: ['Demo work', 'Plan work', 'Fix bugs', 'Write code'], correctAnswer: 'Demo work', orderIndex: 7 },
            { questionText: 'What is an artifact?', options: ['Backlog, Increment', 'Code', 'Meeting', 'Person'], correctAnswer: 'Backlog, Increment', orderIndex: 8 },
            { questionText: 'Is Scrum rigid?', options: ['No, flexible', 'Yes, strict', 'Only on Tuesdays', 'Maybe'], correctAnswer: 'No, flexible', orderIndex: 9 },
            { questionText: 'Can scope change in sprint?', options: ['Ideally no', 'Yes always', 'If boss says', 'If easy'], correctAnswer: 'Ideally no', orderIndex: 10 },
        ],
        'Figma': [
            { questionText: 'What is Figma?', options: ['Design tool', 'Code editor', 'Database', 'Operating System'], correctAnswer: 'Design tool', orderIndex: 1 },
            { questionText: 'Is Figma web-based?', options: ['Yes', 'No', 'Only Mac', 'Only Windows'], correctAnswer: 'Yes', orderIndex: 2 },
            { questionText: 'What creates responsive layouts?', options: ['Auto Layout', 'Constraints', 'Grids', 'Frames'], correctAnswer: 'Auto Layout', orderIndex: 3 },
            { questionText: 'What is a Component?', options: ['Reusable element', 'A layer', 'A group', 'A plugin'], correctAnswer: 'Reusable element', orderIndex: 4 },
            { questionText: 'What is Prototyping?', options: ['Interaction flow', 'Coding', 'Drawing', 'Saving'], correctAnswer: 'Interaction flow', orderIndex: 5 },
            { questionText: 'What stores shared styles?', options: ['Design System / Library', 'Folder', 'File', 'Cloud'], correctAnswer: 'Design System / Library', orderIndex: 6 },
            { questionText: 'What is a Frame?', options: ['Container for elements', 'A box', 'A picture', 'A window'], correctAnswer: 'Container for elements', orderIndex: 7 },
            { questionText: 'Can multiple people edit?', options: ['Yes, realtime', 'No', 'One by one', 'Offline only'], correctAnswer: 'Yes, realtime', orderIndex: 8 },
            { questionText: 'What handles vectors?', options: ['Pen tool', 'Brush', 'Pencil', 'Eraser'], correctAnswer: 'Pen tool', orderIndex: 9 },
            { questionText: 'What installs extra features?', options: ['Plugins', 'Extensions', 'Addons', 'Mods'], correctAnswer: 'Plugins', orderIndex: 10 },
        ],
        'Next.js': [
            { questionText: 'What is Next.js?', options: ['React Framework', 'Vue Framework', 'A database', 'A backend'], correctAnswer: 'React Framework', orderIndex: 1 },
            { questionText: 'What is SSR?', options: ['Server-Side Rendering', 'Super Speed React', 'Static Site React', 'Simple Site Render'], correctAnswer: 'Server-Side Rendering', orderIndex: 2 },
            { questionText: 'What handles routing?', options: ['File-system based', 'React Router', 'Config file', 'Database'], correctAnswer: 'File-system based', orderIndex: 3 },
            { questionText: 'What is getStaticProps?', options: ['Fetch specific data build time', 'Fetch runtime', 'Fetch client side', 'Fetch DB'], correctAnswer: 'Fetch specific data build time', orderIndex: 4 },
            { questionText: 'What is API Routes?', options: ['Backend endpoints', 'Frontend paths', 'Database', 'External API'], correctAnswer: 'Backend endpoints', orderIndex: 5 },
            { questionText: 'What optimizes images?', options: ['next/image', '<img>', 'ReactImage', 'ImageOpt'], correctAnswer: 'next/image', orderIndex: 6 },
            { questionText: 'What is ISR?', options: ['Incremental Static Regeneration', 'Instant Static React', 'Immediate Site Render', 'Internal Server Route'], correctAnswer: 'Incremental Static Regeneration', orderIndex: 7 },
            { questionText: 'What file is the app entry?', options: ['_app.js', 'index.js', 'main.js', 'root.js'], correctAnswer: '_app.js', orderIndex: 8 },
            { questionText: 'Does it support CSS modules?', options: ['Yes', 'No', 'Only SASS', 'Only global'], correctAnswer: 'Yes', orderIndex: 9 },
            { questionText: 'What handles dynamic routes?', options: ['[param].js', '{param}.js', 'param.js', ':param.js'], correctAnswer: '[param].js', orderIndex: 10 },
        ],
        'GraphQL': [
            { questionText: 'What is GraphQL?', options: ['Query language for APIs', 'Database', 'Framework', 'Server'], correctAnswer: 'Query language for APIs', orderIndex: 1 },
            { questionText: 'What retrieves data?', options: ['Query', 'Mutation', 'Subscription', 'Get'], correctAnswer: 'Query', orderIndex: 2 },
            { questionText: 'What modifies data?', options: ['Mutation', 'Query', 'Subscription', 'Post'], correctAnswer: 'Mutation', orderIndex: 3 },
            { questionText: 'What defines the structure?', options: ['Schema', 'Table', 'JSON', 'Object'], correctAnswer: 'Schema', orderIndex: 4 },
            { questionText: 'Does it solve over-fetching?', options: ['Yes', 'No', 'Sometimes', 'Makes it worse'], correctAnswer: 'Yes', orderIndex: 5 },
            { questionText: 'How many endpoints usually?', options: ['One', 'Many', 'None', 'Two'], correctAnswer: 'One', orderIndex: 6 },
            { questionText: 'What allows real-time?', options: ['Subscription', 'Query', 'Mutation', 'Stream'], correctAnswer: 'Subscription', orderIndex: 7 },
            { questionText: 'What visualizes the API?', options: ['GraphiQL', 'Postman', 'Browser', 'Console'], correctAnswer: 'GraphiQL', orderIndex: 8 },
            { questionText: 'Is it typed?', options: ['Yes, strongly typed', 'No', 'Weakly', 'Dynamic'], correctAnswer: 'Yes, strongly typed', orderIndex: 9 },
            { questionText: 'Who developed it?', options: ['Facebook', 'Google', 'Netflix', 'Twitter'], correctAnswer: 'Facebook', orderIndex: 10 },
        ],
        'HTML': [
            { questionText: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'Hyperlinks and Text Markup Language', 'Home Tool Markup Language', 'Hyper Text Meta Language'], correctAnswer: 'Hyper Text Markup Language', orderIndex: 1 },
            { questionText: 'Which tag creates a link?', options: ['<a>', '<link>', '<href>', '<url>'], correctAnswer: '<a>', orderIndex: 2 },
            { questionText: 'Which is the largest heading?', options: ['<h1>', '<h6>', '<head>', '<heading>'], correctAnswer: '<h1>', orderIndex: 3 },
            { questionText: 'What is the correct tag for specific image?', options: ['<img>', '<image>', '<picture>', '<pic>'], correctAnswer: '<img>', orderIndex: 4 },
            { questionText: 'Which list is unordered?', options: ['<ul>', '<ol>', '<li>', '<list>'], correctAnswer: '<ul>', orderIndex: 5 },
            { questionText: 'What attribute creates a tooltip?', options: ['title', 'alt', 'src', 'href'], correctAnswer: 'title', orderIndex: 6 },
            { questionText: 'Which tag makes a new line?', options: ['<br>', '<lb>', '<nl>', '<break>'], correctAnswer: '<br>', orderIndex: 7 },
            { questionText: 'How do you make a checkbox?', options: ['<input type="checkbox">', '<check>', '<box>', '<input type="check">'], correctAnswer: '<input type="checkbox">', orderIndex: 8 },
            { questionText: 'What is the <div> element?', options: ['A container', 'A divider', 'A database', 'A drone'], correctAnswer: 'A container', orderIndex: 9 },
            { questionText: 'Which HTML5 element plays video?', options: ['<video>', '<movie>', '<play>', '<media>'], correctAnswer: '<video>', orderIndex: 10 },
        ],
        'Data Visualization': [
            { questionText: 'What is the primary purpose of data visualization?', options: ['To communicate insights', 'To make data pretty', 'To store data', 'To clean data'], correctAnswer: 'To communicate insights', orderIndex: 1 },
            { questionText: 'Which chart type is best for showing trends over time?', options: ['Line chart', 'Pie chart', 'Bar chart', 'Scatter plot'], correctAnswer: 'Line chart', orderIndex: 2 },
            { questionText: 'What is a dashboard?', options: ['A visual display of key metrics', 'A database table', 'A programming script', 'A cloud server'], correctAnswer: 'A visual display of key metrics', orderIndex: 3 },
            { questionText: 'Which color palette is best for distinct categories?', options: ['Qualitative', 'Sequential', 'Diverging', 'Monochromatic'], correctAnswer: 'Qualitative', orderIndex: 4 },
            { questionText: 'What chart is best for part-to-whole comparisons?', options: ['Pie chart', 'Line chart', 'Scatter plot', 'Histogram'], correctAnswer: 'Pie chart', orderIndex: 5 },
            { questionText: 'What does "data-ink ratio" mean?', options: ['Minimizing non-essential ink', 'Using more color', 'Printing costs', 'Data density'], correctAnswer: 'Minimizing non-essential ink', orderIndex: 6 },
            { questionText: 'Which tool is widely used for BI visualization?', options: ['Tableau', 'Notepad', 'Git', 'Docker'], correctAnswer: 'Tableau', orderIndex: 7 },
            { questionText: 'What is a heatmap used for?', options: ['Showing density or intensity', 'Showing hierarchy', 'Showing flow', 'Showing structure'], correctAnswer: 'Showing density or intensity', orderIndex: 8 },
            { questionText: 'What is the "Z-pattern" in design?', options: ['How eyes scan a page', 'A chart type', 'A sorting algorithm', 'A database index'], correctAnswer: 'How eyes scan a page', orderIndex: 9 },
            { questionText: 'Which is misleading in visualizations?', options: ['Truncating the Y-axis', 'Labeling axes', 'Using a legend', 'Title'], correctAnswer: 'Truncating the Y-axis', orderIndex: 10 },
        ],
        'Data Modeling': [
            { questionText: 'What is normalization?', options: ['Organizing data to reduce redundancy', 'Backing up data', 'Deleting data', 'Visualizing data'], correctAnswer: 'Organizing data to reduce redundancy', orderIndex: 1 },
            { questionText: 'What is a primary key?', options: ['Unique identifier for a record', 'The first column', 'A password', 'A backup key'], correctAnswer: 'Unique identifier for a record', orderIndex: 2 },
            { questionText: 'What is a foreign key?', options: ['Link to another table\'s primary key', 'A translation tool', 'External password', 'A duplicate key'], correctAnswer: 'Link to another table\'s primary key', orderIndex: 3 },
            { questionText: 'What is an ER diagram?', options: ['Entity Relationship Diagram', 'Error Report Diagram', 'External Route Diagram', 'Easy Read Diagram'], correctAnswer: 'Entity Relationship Diagram', orderIndex: 4 },
            { questionText: 'What is a star schema?', options: ['Data mart schema with fact/dim tables', 'A galaxy map', 'A network topology', 'A programming pattern'], correctAnswer: 'Data mart schema with fact/dim tables', orderIndex: 5 },
            { questionText: 'What is a one-to-many relationship?', options: ['One record links to multiple records', 'One record links to one record', 'Many records link to many', 'None of the above'], correctAnswer: 'One record links to multiple records', orderIndex: 6 },
            { questionText: 'What is denormalization?', options: ['Adding redundancy for performance', 'Cleaning data', 'Deleting tables', 'Sorting data'], correctAnswer: 'Adding redundancy for performance', orderIndex: 7 },
            { questionText: 'What is SQL?', options: ['Structured Query Language', 'Simple Question Language', 'Standard Query List', 'System Quality Level'], correctAnswer: 'Structured Query Language', orderIndex: 8 },
            { questionText: 'What is an attribute in data modeling?', options: ['A property of an entity', 'A table name', 'A query', 'A database'], correctAnswer: 'A property of an entity', orderIndex: 9 },
            { questionText: 'What represents an "Is-A" relationship?', options: ['Inheritance/Subtyping', 'Aggregation', 'Composition', 'Association'], correctAnswer: 'Inheritance/Subtyping', orderIndex: 10 },
        ],
        'Artificial Intelligence': [
            { questionText: 'What is AI?', options: ['Simulation of human intelligence', 'A robot', 'A database', 'A programming language'], correctAnswer: 'Simulation of human intelligence', orderIndex: 1 },
            { questionText: 'What is the Turing Test?', options: ['Test for machine intelligence', 'A math test', 'A code quiz', 'A hardware test'], correctAnswer: 'Test for machine intelligence', orderIndex: 2 },
            { questionText: 'What is Machine Learning?', options: ['Subset of AI learning from data', 'Subset of AI for robotics', 'Just stats', 'Hardware design'], correctAnswer: 'Subset of AI learning from data', orderIndex: 3 },
            { questionText: 'What is a Neural Network?', options: ['Mimics biological neurons', 'A computer network', 'A web server', 'A graph'], correctAnswer: 'Mimics biological neurons', orderIndex: 4 },
            { questionText: 'What is NLP?', options: ['Natural Language Processing', 'New Language Protocol', 'Network Level Protocol', 'None'], correctAnswer: 'Natural Language Processing', orderIndex: 5 },
            { questionText: 'What is Computer Vision?', options: ['Computers understanding images', 'A monitor', 'A webcam', 'Glasses'], correctAnswer: 'Computers understanding images', orderIndex: 6 },
            { questionText: 'What is Deep Learning?', options: ['ML with many layers', 'Learning deeply', 'Reading books', 'Advanced SQL'], correctAnswer: 'ML with many layers', orderIndex: 7 },
            { questionText: 'What is an expert system?', options: ['Emulates human expert decision', 'A smart user', 'A dictionary', 'A search engine'], correctAnswer: 'Emulates human expert decision', orderIndex: 8 },
            { questionText: 'What is reinforcement learning?', options: ['Learning via rewards/penalties', 'Learning by reading', 'Learning by watching', 'Learning by coding'], correctAnswer: 'Learning via rewards/penalties', orderIndex: 9 },
            { questionText: 'Who coined the term "Artificial Intelligence"?', options: ['John McCarthy', 'Alan Turing', 'Elon Musk', 'Bill Gates'], correctAnswer: 'John McCarthy', orderIndex: 10 },
        ],
    };

    // Seed questions for ALL tests
    for (const skill of allSkills) {
        let questions: any[] = [];

        // Use specific questions if available
        if (questionBank[skill.name] && questionBank[skill.name].length > 0) {
            questions = questionBank[skill.name];
        }

        // Add Specific Questions to MEDIUM/HARD mainly, generic for others if needed
        // BUT better: Use these real questions for ALL levels if we have enough?
        // Let's split them: 1-3 Easy, 4-7 Medium, 8-10 Hard? Or just reuse for now to ensure quality

        if (questions.length > 0) {
            // Distribute questions if possible
            // 1-4 Easy, 5-7 Medium, 8-10 Hard
            await seedQuestionsForTest(`test-${skill.id}-EASY`, questions.slice(0, 4));
            await seedQuestionsForTest(`test-${skill.id}-MEDIUM`, questions.slice(4, 7));
            await seedQuestionsForTest(`test-${skill.id}-HARD`, questions.slice(7));
        } else {
            // Fallback for skills without specific questions
            await seedQuestionsForTest(`test-${skill.id}-EASY`, getGenericQuestions(skill.name, 'EASY'));
            await seedQuestionsForTest(`test-${skill.id}-MEDIUM`, getGenericQuestions(skill.name, 'MEDIUM'));
            await seedQuestionsForTest(`test-${skill.id}-HARD`, getGenericQuestions(skill.name, 'HARD'));
        }
    }

    console.log(`✅ Seeded test questions for ${allSkills.length} skills`);

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

