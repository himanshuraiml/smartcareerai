import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

const challenges = [
    {
        title: "The Middle of the Chain",
        description: "Find the middle of a Singly Linked List in a single pass. For even length, return the second middle.",
        difficulty: Difficulty.EASY,
        category: "Linked List",
        tags: ["two-pointers", "optimal"],
        starterCode: {
            python: "def findMiddle(head):\n    # Write your code here\n    pass",
            javascript: "function findMiddle(head) {\n    // Write your code here\n}",
            java: "class Solution {\n    public ListNode findMiddle(ListNode head) {\n        // Write your code here\n        return null;\n    }\n}"
        },
        testCases: [
            { input: "[1,2,3,4,5]", expectedOutput: "3" },
            { input: "[1,2,3,4,5,6]", expectedOutput: "4" }
        ],
        timeLimit: 2,
        memoryLimit: 128
    },
    {
        title: "The Fibonacci Stairs",
        description: "Count distinct ways to climb N stairs (1 or 2 steps). This is a foundational dynamic programming problem.",
        difficulty: Difficulty.EASY,
        category: "Dynamic Programming",
        tags: ["recursion", "memoization"],
        starterCode: {
            python: "def climbStairs(n):\n    # Write your code here\n    pass",
            javascript: "function climbStairs(n) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "2", expectedOutput: "2" },
            { input: "3", expectedOutput: "3" }
        ],
        timeLimit: 1,
        memoryLimit: 64
    },
    {
        title: "The Mirror Chain",
        description: "Check if a linked list of characters forms a palindrome. Useful for verifying symmetrical data sequences.",
        difficulty: Difficulty.EASY,
        category: "Linked List",
        tags: ["palindrome", "string-manipulation"],
        starterCode: {
            python: "def isPalindrome(head):\n    # Write your code here\n    pass",
            javascript: "function isPalindrome(head) {\n    // Write your code here\n}",
            java: "class Solution {\n    public boolean isPalindrome(ListNode head) {\n        // Write your code here\n        return false;\n    }\n}"
        },
        testCases: [
            { input: "['a', 'b', 'c', 'b', 'a']", expectedOutput: "true" },
            { input: "['a', 'b', 'c']", expectedOutput: "false" }
        ],
        timeLimit: 2,
        memoryLimit: 128
    },
    {
        title: "The Disciplined Lecture",
        description: "Determine if a lecture is cancelled based on student arrival times and threshold K. Students with arrival <= 0 are on time.",
        difficulty: Difficulty.EASY,
        category: "Arrays",
        tags: ["conditions", "loops"],
        starterCode: {
            python: "def isCancelled(k, arrivalTimes):\n    # Write your code here\n    pass",
            javascript: "function isCancelled(k, arrivalTimes) {\n    // Write your code here\n}",
            java: "class Solution {\n    public String isCancelled(int k, int[] arrivalTimes) {\n        // Write your code here\n        return \"\";\n    }\n}"
        },
        testCases: [
            { input: "3, [-2, -1, 0, 1, 2]", expectedOutput: "NO" },
            { input: "3, [-1, 0, 1, 2]", expectedOutput: "YES" }
        ],
        timeLimit: 1,
        memoryLimit: 64
    },
    {
        title: "The Echoing Roots",
        description: "Process a stream of inputs and print their square roots in reverse order of input. Tests standard I/O and precision.",
        difficulty: Difficulty.EASY,
        category: "I/O",
        tags: ["stack", "math"],
        starterCode: {
            python: "def reverseRoots(numbers):\n    # Write your code here\n    pass",
            javascript: "function reverseRoots(numbers) {\n    // Write your code here\n}",
            java: "import java.util.*;\nclass Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}"
        },
        testCases: [
            { input: "144 16 0", expectedOutput: "0.0000\n4.0000\n12.0000" }
        ],
        timeLimit: 2,
        memoryLimit: 256
    },
    {
        title: "The Infinite Corridor",
        description: "Detect a cycle in a linked list and return the starting node of the cycle. Uses Floyd's cycle-finding algorithm logic.",
        difficulty: Difficulty.MEDIUM,
        category: "Linked List",
        tags: ["cycle-detection", "pointers"],
        starterCode: {
            python: "def detectCycle(head):\n    # Write your code here\n    pass",
            javascript: "function detectCycle(head) {\n    // Write your code here\n}",
            java: "class Solution {\n    public ListNode detectCycle(ListNode head) {\n        // Write your code here\n        return null;\n    }\n}"
        },
        testCases: [
            { input: "pos=1", expectedOutput: "tail connects to node index 1" }
        ],
        timeLimit: 2,
        memoryLimit: 128
    },
    {
        title: "The Cyber-Heist",
        description: "Maximize data collection from non-adjacent servers using Dynamic Programming. Similar to the classical House Robber problem.",
        difficulty: Difficulty.MEDIUM,
        category: "Dynamic Programming",
        tags: ["optimization", "greedy"],
        starterCode: {
            python: "def maxData(servers):\n    # Write your code here\n    pass",
            javascript: "function maxData(servers) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int maxData(int[] servers) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "[10, 20, 30, 10]", expectedOutput: "40" },
            { input: "[2, 7, 9, 3, 1]", expectedOutput: "12" }
        ],
        timeLimit: 1,
        memoryLimit: 64
    },
    {
        title: "The Keyword Search Engine",
        description: "Count occurrences of multiple query strings within a large document set using efficient Hashing or Frequency maps.",
        difficulty: Difficulty.MEDIUM,
        category: "Hashing",
        tags: ["strings", "efficiency"],
        starterCode: {
            python: "def countKeywords(queries, documents):\n    # Write your code here\n    pass",
            javascript: "function countKeywords(queries, documents) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int[] countKeywords(String[] queries, String[] documents) {\n        // Write your code here\n        return new int[0];\n    }\n}"
        },
        testCases: [
            { input: "['abc', 'def'], ['abc', 'abc', 'def', 'ghi']", expectedOutput: "[2, 1]" }
        ],
        timeLimit: 2,
        memoryLimit: 256
    },
    {
        title: "The Valid Parentheses Path",
        description: "Determine the minimum number of insertions required to make a sequence of brackets valid.",
        difficulty: Difficulty.MEDIUM,
        category: "Stacks",
        tags: ["greedy", "parsing"],
        starterCode: {
            python: "def minInsertions(s):\n    # Write your code here\n    pass",
            javascript: "function minInsertions(s) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int minInsertions(String s) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "()))", expectedOutput: "2" },
            { input: "(((", expectedOutput: "3" }
        ],
        timeLimit: 1,
        memoryLimit: 64
    },
    {
        title: "The Missing Sector Sum",
        description: "Find an equilibrium index where the sum of sub-arrays to its left and right are exactly equal.",
        difficulty: Difficulty.MEDIUM,
        category: "Arrays",
        tags: ["prefix-sum", "optimization"],
        starterCode: {
            python: "def equilibriumIndex(nums):\n    # Write your code here\n    pass",
            javascript: "function equilibriumIndex(nums) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int equilibriumIndex(int[] nums) {\n        // Write your code here\n        return -1;\n    }\n}"
        },
        testCases: [
            { input: "[1, 7, 3, 6, 5, 6]", expectedOutput: "3" },
            { input: "[1, 2, 3]", expectedOutput: "-1" }
        ],
        timeLimit: 1,
        memoryLimit: 64
    },
    {
        title: "The Maze Runner's Strategy",
        description: "Calculate the maximum reward path on an M x N grid where diagonal moves are allowed under specific conditions.",
        difficulty: Difficulty.HARD,
        category: "Dynamic Programming",
        tags: ["grid", "state-machine"],
        starterCode: {
            python: "def maxReward(grid):\n    # Write your code here\n    pass",
            javascript: "function maxReward(grid) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int maxReward(int[][] grid) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "[[1,3,1],[1,5,1],[4,2,1]]", expectedOutput: "7" }
        ],
        timeLimit: 3,
        memoryLimit: 256
    },
    {
        title: "The Digital Fortress",
        description: "Count how many N-digit numbers exist in base K such that no two zeros appear consecutively. Adapted from Timus 1009.",
        difficulty: Difficulty.HARD,
        category: "Combinatorial DP",
        tags: ["math", "performance"],
        starterCode: {
            python: "def countNumbers(n, k):\n    # Write your code here\n    pass",
            javascript: "function countNumbers(n, k) {\n    // Write your code here\n}",
            java: "class Solution {\n    public long countNumbers(int n, int k) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "2, 10", expectedOutput: "90" }
        ],
        timeLimit: 1,
        memoryLimit: 64
    },
    {
        title: "The Smart City Network",
        description: "Connect all districts with roads or power hubs at minimum total cost. Requires Minimum Spanning Tree logic.",
        difficulty: Difficulty.HARD,
        category: "Graphs",
        tags: ["greedy", "mst"],
        starterCode: {
            python: "def minCost(n, roads, hubs):\n    # Write your code here\n    pass",
            javascript: "function minCost(n, roads, hubs) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int minCost(int n, int[][] roads, int[] hubs) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "4, [[1,2,1], [2,3,2]], [3,3,3,3]", expectedOutput: "7" }
        ],
        timeLimit: 2,
        memoryLimit: 128
    },
    {
        title: "The Typo Cost Strategy",
        description: "Calculate the minimum Edit Distance between two complex command strings using optimized DP to handle memory constraints.",
        difficulty: Difficulty.HARD,
        category: "Dynamic Programming",
        tags: ["edit-distance", "strings"],
        starterCode: {
            python: "def editDistance(s1, s2):\n    # Write your code here\n    pass",
            javascript: "function editDistance(s1, s2) {\n    // Write your code here\n}",
            java: "class Solution {\n    public int editDistance(String s1, String s2) {\n        // Write your code here\n        return 0;\n    }\n}"
        },
        testCases: [
            { input: "'horse', 'ros'", expectedOutput: "3" }
        ],
        timeLimit: 2,
        memoryLimit: 128
    },
    {
        title: "The String Decrypter",
        description: "Decode an encoded string like '3[a2[bc]]' into its full expanded form. Tests recursive thinking or stack usage.",
        difficulty: Difficulty.HARD,
        category: "Parsing",
        tags: ["recursion", "stack"],
        starterCode: {
            python: "def decrypt(s):\n    # Write your code here\n    pass",
            javascript: "function decrypt(s) {\n    // Write your code here\n}",
            java: "class Solution {\n    public String decrypt(String s) {\n        // Write your code here\n        return \"\";\n    }\n}"
        },
        testCases: [
            { input: "'3[a]2[bc]'", expectedOutput: "'aaabcbc'" }
        ],
        timeLimit: 1,
        memoryLimit: 128
    }
];

async function main() {
    console.log('--- Starting Recruitment Challenge Seeding ---');
    for (const challenge of challenges) {
        const existing = await prisma.codingChallenge.findFirst({
            where: { title: challenge.title }
        });

        if (!existing) {
            await prisma.codingChallenge.create({
                data: challenge as any
            });
            console.log(`[CREATED] ${challenge.title} (${challenge.difficulty})`);
        } else {
            console.log(`[SKIPPED] ${challenge.title} already exists.`);
        }
    }
    console.log('--- Seeding Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
