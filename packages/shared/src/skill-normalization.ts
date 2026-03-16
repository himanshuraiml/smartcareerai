// Skill aliases for normalization — canonical name mappings
const SKILL_ALIASES: Record<string, string> = {
    // AI/ML
    'ai': 'Artificial Intelligence',
    'artificial intelligence': 'Artificial Intelligence',
    'ml': 'Machine Learning',
    'machine learning': 'Machine Learning',
    'genai': 'Generative AI',
    'gen ai': 'Generative AI',
    'generative ai': 'Generative AI',
    'deep learning': 'Deep Learning',
    'dl': 'Deep Learning',
    'nlp': 'Natural Language Processing',
    'natural language processing': 'Natural Language Processing',
    'cv': 'Computer Vision',
    'computer vision': 'Computer Vision',
    // Data
    'modeling': 'Data Modeling',
    'data modeling': 'Data Modeling',
    'data modelling': 'Data Modeling',
    'viz': 'Data Visualization',
    'vis': 'Data Visualization',
    'visualization': 'Data Visualization',
    'visualisation': 'Data Visualization',
    'data visualization': 'Data Visualization',
    'data visualisation': 'Data Visualization',
    'feature engineering': 'Feature Engineering',
    'numpy': 'NumPy',
    'sklearn': 'Scikit-learn',
    'scikit-learn': 'Scikit-learn',
    'scikit learn': 'Scikit-learn',
    // Programming languages
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'reactjs': 'React',
    'react.js': 'React',
    'react js': 'React',
    'nodejs': 'Node.js',
    'node': 'Node.js',
    'node.js': 'Node.js',
    'node js': 'Node.js',
    'golang': 'Go',
    'c#': 'C#',
    'csharp': 'C#',
    'c sharp': 'C#',
    'dotnet': '.NET',
    '.net': '.NET',
    'c++': 'C++',
    'cpp': 'C++',
    'c plus plus': 'C++',
    // Tools & Frameworks
    'qa': 'Test Automation',
    'tf': 'TensorFlow',
    'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch',
    'k8s': 'Kubernetes',
    'kube': 'Kubernetes',
    'kubernetes': 'Kubernetes',
    'postgres': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mongo': 'MongoDB',
    'mongodb': 'MongoDB',
    // Cloud & Infrastructure
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'gcp': 'Google Cloud',
    'google cloud': 'Google Cloud',
    'azure': 'Azure',
    'microsoft azure': 'Azure',
    'cloud': 'Cloud Computing',
    'cloud computing': 'Cloud Computing',
    'cloud infrastructure': 'Cloud Computing',
    'devops': 'DevOps',
    'cicd': 'CI/CD',
    'ci/cd': 'CI/CD',
    'ci cd': 'CI/CD',
    'linux': 'Linux',
    'unix': 'Unix',
    'bash': 'Bash Scripting',
    'shell scripting': 'Shell Scripting',
    'shell': 'Shell Scripting',
    // Security
    'cyber': 'Cybersecurity',
    'cyber security': 'Cybersecurity',
    'cybersecurity': 'Cybersecurity',
    'infosec': 'Information Security',
    'information security': 'Information Security',
    // Analytics
    'analytics': 'Data Analytics',
    'data analytics': 'Data Analytics',
    'data analysis': 'Data Analytics',
    'data science': 'Data Science',
    // Common raw names that come in lowercase from LLMs
    'excel': 'Excel',
    'git': 'Git',
    'go': 'Go',
    'rust': 'Rust',
    'java': 'Java',
    'python': 'Python',
    'sql': 'SQL',
    'html': 'HTML',
    'css': 'CSS',
    'api': 'REST APIs',
    'rest api': 'REST APIs',
    'rest apis': 'REST APIs',
    'graphql': 'GraphQL',
    'figma': 'Figma',
    'tableau': 'Tableau',
    'docker': 'Docker',
    'react': 'React',
    'vue': 'Vue.js',
    'vue.js': 'Vue.js',
    'angular': 'Angular',
    'flask': 'Flask',
    'django': 'Django',
    'fastapi': 'FastAPI',
    'agile': 'Agile',
    'scrum': 'Scrum',
    'statistics': 'Statistics',
    'pandas': 'Pandas',
    'r': 'R',
    'spark': 'Apache Spark',
    'apache spark': 'Apache Spark',
    'hadoop': 'Hadoop',
    'kafka': 'Apache Kafka',
    'apache kafka': 'Apache Kafka',
    'redis': 'Redis',
    'elasticsearch': 'Elasticsearch',
    'terraform': 'Terraform',
    'ansible': 'Ansible',
    'jenkins': 'Jenkins',
    'jira': 'Jira',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'flutter': 'Flutter',
    'unity': 'Unity',
    'opencv': 'OpenCV',
    'langchain': 'LangChain',
};

// Generic terms that should never be saved as skills
const SKILL_BLOCKLIST = new Set([
    'developer',
    'software',
    'software developer',
    'engineer',
    'dev',
    'technologies',
    'tools',
    'frameworks',
    'programming',
    'coding',
    'web',
    'app',
    'application',
    'system',
    'computer',
    'science',
    'development',
    'server',
    'security',
    'network',
    'management',
    'design',
    'testing',
    'debugging',
    'implementation',
    'integration',
    'optimization',
    'architecture',
    'deployment',
    'infrastructure',
    'it infrastructure',
]);

/**
 * Apply Title Case to a skill name that has no canonical alias.
 * Preserves all-uppercase acronyms (SQL, HTML, AWS) and existing mixed-case
 * words (Node.js, PostgreSQL) while capitalising the first letter of each
 * all-lowercase word.
 */
function applyTitleCase(str: string): string {
    return str
        .trim()
        .split(/\s+/)
        .map(word => {
            // Already has internal uppercase (e.g. Node.js, TypeScript, PostgreSQL) → leave
            if (/[A-Z]/.test(word.slice(1))) return word;
            // All uppercase and length > 1 (acronyms: SQL, HTML, AWS) → leave
            if (word === word.toUpperCase() && word.length > 1) return word;
            // Purely lowercase → capitalise first letter
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

/**
 * Normalize a skill name: apply alias mapping and blocklist filtering.
 * Returns the canonical skill name, or null if the skill should be blocked.
 */
export function normalizeSkillName(name: string): string | null {
    const trimmed = name.trim();
    const lowerName = trimmed.toLowerCase();

    if (!lowerName || lowerName.length < 2) {
        return null;
    }

    // Check blocklist
    if (SKILL_BLOCKLIST.has(lowerName)) {
        return null;
    }

    // Check direct alias
    if (SKILL_ALIASES[lowerName]) {
        return SKILL_ALIASES[lowerName];
    }

    // No alias — apply Title Case so raw LLM output like "infrastructure"
    // becomes "Infrastructure" rather than being stored as-is.
    return applyTitleCase(trimmed);
}

/**
 * Normalize and deduplicate an array of skill names.
 * Returns unique, normalized skill names with blocked terms removed.
 */
export function normalizeSkillList(names: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const name of names) {
        const normalized = normalizeSkillName(name);
        if (normalized && !seen.has(normalized.toLowerCase())) {
            seen.add(normalized.toLowerCase());
            result.push(normalized);
        }
    }

    return result;
}
