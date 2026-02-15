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
    // Cloud
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'gcp': 'Google Cloud',
    'google cloud': 'Google Cloud',
    'azure': 'Azure',
    'microsoft azure': 'Azure',
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
]);

/**
 * Normalize a skill name: apply alias mapping and blocklist filtering.
 * Returns the canonical skill name, or null if the skill should be blocked.
 */
export function normalizeSkillName(name: string): string | null {
    const lowerName = name.toLowerCase().trim();

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

    return name.trim();
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
