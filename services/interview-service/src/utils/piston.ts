import { logger } from './logger';

// ──────────────────────────────────────────────────────────────────────────────
// Provider selection
// Set CODE_EXECUTION_PROVIDER=judge0  → uses Judge0 (RapidAPI or self-hosted)
// Default (or =piston)                → uses self-hosted Piston
// ──────────────────────────────────────────────────────────────────────────────
const PROVIDER = process.env.CODE_EXECUTION_PROVIDER || 'piston';
const PISTON_API = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2';
const JUDGE0_API = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || '';

// ──────────────────────────────────────────────────────────────────────────────
// Language mappings
// ──────────────────────────────────────────────────────────────────────────────
export const LANGUAGE_VERSIONS: Record<string, string> = {
    python: '3.10.0',
    javascript: '18.15.0',
    java: '15.0.2',
    cpp: '10.2.0',
    c: '10.2.0',
    typescript: '5.0.3',
    go: '1.16.2',
    rust: '1.50.0',
};

const EXTENSIONS: Record<string, string> = {
    python: 'py', javascript: 'js', java: 'java',
    cpp: 'cpp', c: 'c', typescript: 'ts', go: 'go', rust: 'rs',
};

// Judge0 CE language IDs  https://ce.judge0.com/languages
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
    python: 71,       // Python 3.8.1
    javascript: 63,   // Node.js 12.14.0
    java: 62,         // Java 13.0.1
    cpp: 54,          // C++ 17 (G++ 7.4.0)
    c: 50,            // C (GCC 9.2.0)
    typescript: 74,   // TypeScript 3.7.4
    go: 60,           // Go 1.13.5
    rust: 73,         // Rust 1.40.0
};

// ──────────────────────────────────────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────────────────────────────────────
export interface PistonRunResult {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
}

export interface PistonResponse {
    language: string;
    version: string;
    run: PistonRunResult;
    compile?: {
        stdout: string;
        stderr: string;
        code: number | null;
        signal: string | null;
        output: string;
    };
}

export interface TestCaseResult {
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    executionTimeMs?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Piston provider
// ──────────────────────────────────────────────────────────────────────────────
async function executeViaPiston(
    language: string, code: string, stdin: string, timeoutMs: number
): Promise<PistonResponse> {
    const version = LANGUAGE_VERSIONS[language];
    if (!version) throw new Error(`Unsupported language: ${language}`);

    const ext = EXTENSIONS[language] || 'txt';
    const fileName = language === 'java' ? 'Main.java' : `solution.${ext}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language, version,
                files: [{ name: fileName, content: code }],
                stdin,
                run_timeout: 5000,
                compile_timeout: 10000,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Piston API error ${response.status}: ${text}`);
        }

        return await response.json() as PistonResponse;
    } finally {
        clearTimeout(timeout);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Judge0 provider — normalises response into PistonResponse shape
// ──────────────────────────────────────────────────────────────────────────────
async function executeViaJudge0(
    language: string, code: string, stdin: string, timeoutMs: number
): Promise<PistonResponse> {
    const languageId = JUDGE0_LANGUAGE_IDS[language];
    if (!languageId) throw new Error(`Unsupported language: ${language}`);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (JUDGE0_RAPIDAPI_KEY) {
        headers['X-RapidAPI-Key'] = JUDGE0_RAPIDAPI_KEY;
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // wait=true makes it synchronous (blocks until done, up to 15s)
        const response = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                language_id: languageId,
                source_code: code,
                stdin: stdin || '',
                cpu_time_limit: 5,
                wall_time_limit: 10,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Judge0 API error ${response.status}: ${text}`);
        }

        const result = await response.json() as Record<string, any>;

        // Status IDs: 3 = Accepted, 6 = Compilation Error, 5 = TLE, 7-12 = Runtime errors
        const isCompileError = result.status?.id === 6;
        const isSuccess = result.status?.id === 3;
        const exitCode = isSuccess ? 0 : (result.status?.id ?? 1);

        return {
            language,
            version: LANGUAGE_VERSIONS[language],
            run: {
                stdout: result.stdout || '',
                stderr: isCompileError ? '' : (result.stderr || result.message || ''),
                code: exitCode,
                signal: null,
                output: result.stdout || result.stderr || '',
            },
            ...(isCompileError && {
                compile: {
                    stdout: '',
                    stderr: result.compile_output || result.message || 'Compilation error',
                    code: 1,
                    signal: null,
                    output: result.compile_output || '',
                },
            }),
        };
    } finally {
        clearTimeout(timeout);
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API (same interface regardless of provider)
// ──────────────────────────────────────────────────────────────────────────────
export async function executeCode(
    language: string,
    code: string,
    stdin: string = '',
    timeoutMs: number = 15000
): Promise<PistonResponse> {
    try {
        const result = PROVIDER === 'judge0'
            ? await executeViaJudge0(language, code, stdin, timeoutMs)
            : await executeViaPiston(language, code, stdin, timeoutMs);

        logger.info(`[${PROVIDER}] executed ${language}: exit=${result.run.code}, stdout=${result.run.stdout.slice(0, 80)}`);
        return result;
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Code execution timed out');
        logger.error(`[${PROVIDER}] execution error:`, err);
        throw err;
    }
}

export async function runTestCases(
    language: string,
    code: string,
    testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>,
    includeHidden = false
): Promise<{ results: TestCaseResult[]; passed: number; total: number; executionTimeMs: number }> {
    const results: TestCaseResult[] = [];
    let passed = 0;
    const startTime = Date.now();

    for (const tc of testCases) {
        try {
            const pistonResult = await executeCode(language, code, tc.input);

            const actualOutput = (pistonResult.run.stdout || '').trim();
            const expected = (tc.expectedOutput || '').trim();
            const hasError = !!(pistonResult.run.stderr && pistonResult.run.code !== 0) ||
                !!(pistonResult.compile?.code && pistonResult.compile.code !== 0);

            const testPassed = !hasError && actualOutput === expected;
            if (testPassed) passed++;

            if (!tc.isHidden || includeHidden) {
                results.push({
                    passed: testPassed,
                    input: tc.isHidden ? '[Hidden]' : tc.input,
                    expectedOutput: tc.isHidden ? '[Hidden]' : expected,
                    actualOutput: tc.isHidden ? (testPassed ? 'Correct' : 'Incorrect') : actualOutput,
                    error: hasError ? (pistonResult.compile?.stderr || pistonResult.run.stderr) : undefined,
                });
            } else {
                results.push({
                    passed: testPassed,
                    input: '[Hidden test case]',
                    expectedOutput: '[Hidden]',
                    actualOutput: testPassed ? 'Correct' : 'Incorrect',
                    error: hasError ? 'Runtime or compilation error' : undefined,
                });
            }
        } catch (err: any) {
            results.push({
                passed: false,
                input: tc.isHidden ? '[Hidden]' : tc.input,
                expectedOutput: tc.isHidden ? '[Hidden]' : tc.expectedOutput,
                actualOutput: '',
                error: err.message,
            });
        }
    }

    return { results, passed, total: testCases.length, executionTimeMs: Date.now() - startTime };
}
