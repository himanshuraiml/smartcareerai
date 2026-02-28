import { logger } from './logger';

const PISTON_API = 'https://emkc.org/api/v2/piston';

// Supported language → Piston version mapping
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

// File extension per language
const EXTENSIONS: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    typescript: 'ts',
    go: 'go',
    rust: 'rs',
};

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

export async function executeCode(
    language: string,
    code: string,
    stdin: string = '',
    timeoutMs: number = 10000
): Promise<PistonResponse> {
    const version = LANGUAGE_VERSIONS[language];
    if (!version) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const ext = EXTENSIONS[language] || 'txt';
    const fileName = language === 'java' ? 'Main.java' : `solution.${ext}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language,
                version,
                files: [{ name: fileName, content: code }],
                stdin,
                run_timeout: 5000,    // ms cap per run
                compile_timeout: 10000,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Piston API error ${response.status}: ${text}`);
        }

        const result = await response.json() as PistonResponse;
        logger.info(`Piston executed ${language}: exit=${result.run.code}, stdout=${result.run.stdout.slice(0, 80)}`);
        return result;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new Error('Code execution timed out');
        }
        logger.error('Piston execution error:', err);
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Run code against multiple test cases and return per-case results.
 * Hidden test cases are included for scoring but not returned in output.
 */
export async function runTestCases(
    language: string,
    code: string,
    testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>,
    includeHidden = false
): Promise<{ results: TestCaseResult[]; passed: number; total: number; executionTimeMs: number }> {
    const visibleCases = includeHidden ? testCases : testCases;
    const results: TestCaseResult[] = [];
    let passed = 0;
    const startTime = Date.now();

    for (const tc of visibleCases) {
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
                // Include hidden case result but mask I/O
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

    const executionTimeMs = Date.now() - startTime;
    return { results, passed, total: visibleCases.length, executionTimeMs };
}
