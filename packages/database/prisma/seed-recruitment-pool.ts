import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

const challenges = [
    // --- EASY ---
    {
        title: "The Middle of the Chain",
        difficulty: Difficulty.EASY,
        category: "linked-list",
        tags: ["linked-list", "two-pointers"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "In a single pass, identify the middle element of a singly linked list. If the list has an even number of elements, return the second middle element.",
        constraints: "Number of nodes: [1, 10^5]. Node values: [1, 10^6].",
        examples: [
            { input: "1 2 3 4 5", output: "3" },
            { input: "1 2 3 4 5 6", output: "4" }
        ],
        testCases: [
            { input: "1 2 3 4 5", expectedOutput: "3", isHidden: false },
            { input: "1 2 3 4 5 6", expectedOutput: "4", isHidden: false },
            { input: "10", expectedOutput: "10", isHidden: true },
            { input: "1 2", expectedOutput: "2", isHidden: true }
        ],
        starterCode: {
            python: "def find_middle(head):\n    # TODO: Implement\n    pass",
            javascript: "function findMiddle(head) {\n    // TODO: Implement\n}",
            java: "public class Solution {\n    public int findMiddle(ListNode head) {\n        // TODO: Implement\n        return 0;\n    }\n}",
            cpp: "int findMiddle(ListNode* head) {\n    // TODO: Implement\n    return 0;\n}"
        }
    },
    {
        title: "The Fibonacci Stairs",
        difficulty: Difficulty.EASY,
        category: "dynamic-programming",
        tags: ["recursion", "memoization"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "You are ascending a flight of stairs that has N steps. You can take either 1 or 2 steps at a time. How many distinct ways can you reach the top?",
        constraints: "1 <= N <= 45",
        examples: [{ input: "3", output: "3", explanation: "1+1+1, 1+2, 2+1" }],
        testCases: [
            { input: "3", expectedOutput: "3", isHidden: false },
            { input: "10", expectedOutput: "89", isHidden: true }
        ],
        starterCode: {
            python: "def climb_stairs(n):\n    pass",
            javascript: "function climbStairs(n) {\n}",
            java: "public int climbStairs(int n) {\n}",
            cpp: "int climbStairs(int n) {\n}"
        }
    },
    {
        title: "The Mirror Chain",
        difficulty: Difficulty.EASY,
        category: "linked-list",
        tags: ["palindrome", "pointers"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Determine if a singly linked list is a palindrome (reads the same forward and backward).",
        constraints: "Number of nodes: [1, 10^5]. Node values: single character strings.",
        examples: [{ input: "a -> b -> a", output: "true" }],
        testCases: [
            { input: "a b a", expectedOutput: "true", isHidden: false },
            { input: "a b", expectedOutput: "false", isHidden: true }
        ],
        starterCode: {
            python: "def is_palindrome(head):\n    pass",
            javascript: "function isPalindrome(head) {\n}",
            java: "public boolean isPalindrome(ListNode head) {\n}",
            cpp: "bool isPalindrome(ListNode* head) {\n}"
        }
    },
    {
        title: "The Disciplined Lecture",
        difficulty: Difficulty.EASY,
        category: "arrays",
        tags: ["logic", "loops"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "A lecture is cancelled if fewer than K students arrive on time (arrival time <= 0). Given arrival times of N students, determine if the lecture is cancelled.",
        constraints: "1 <= N <= 1000. 1 <= K <= N.",
        examples: [{ input: "N=4, K=3, times=[-1, -3, 4, 2]", output: "YES" }],
        testCases: [
            { input: "4 3\n-1 -3 4 2", expectedOutput: "YES", isHidden: false },
            { input: "4 2\n0 -1 2 1", expectedOutput: "NO", isHidden: true }
        ],
        starterCode: {
            python: "def is_cancelled(n, k, times):\n    pass",
            javascript: "function isCancelled(n, k, times) {\n}",
            java: "public String isCancelled(int n, int k, int[] times) {\n}",
            cpp: "string isCancelled(int n, int k, vector<int>& times) {\n}"
        }
    },
    {
        title: "The Echoing Roots",
        difficulty: Difficulty.EASY,
        category: "math",
        tags: ["stack", "precision"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Given a list of numbers, calculate their square roots and output them in reverse order of input, formatted to 4 decimal places.",
        constraints: "Up to 10^5 numbers. Each number up to 10^18.",
        examples: [{ input: "144 16", output: "4.0000 12.0000" }],
        testCases: [
            { input: "144 16", expectedOutput: "4.0000\n12.0000", isHidden: false }
        ],
        starterCode: {
            python: "import math\ndef solve(nums):\n    pass",
            javascript: "function solve(nums) {\n}",
            java: "public void solve(long[] nums) {\n}",
            cpp: "void solve(vector<long long>& nums) {\n}"
        }
    },

    // --- MEDIUM ---
    {
        title: "The Infinite Corridor",
        difficulty: Difficulty.MEDIUM,
        category: "linked-list",
        tags: ["cycle-detection", "floyd"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Detect if a linked list contains a cycle. If it does, return the node where the cycle begins. If not, return null.",
        constraints: "Nodes: [0, 10^4].",
        testCases: [],
        starterCode: {
            python: "def detect_cycle(head):\n    pass",
            javascript: "function detectCycle(head) {\n}",
            java: "public ListNode detectCycle(ListNode head) {\n}",
            cpp: "ListNode* detectCycle(ListNode* head) {\n}"
        }
    },
    {
        title: "The Cyber-Heist",
        difficulty: Difficulty.MEDIUM,
        category: "dynamic-programming",
        tags: ["optimization", "house-robber"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "A cybersecurity expert wants to extract data from servers in a row. They cannot breach two adjacent servers. Maximize the total data value extracted.",
        constraints: "N: [1, 10^5]. Values: [0, 10^4].",
        testCases: [],
        starterCode: {
            python: "def max_data(values):\n    pass",
            javascript: "function maxData(values) {\n}",
            java: "public int maxData(int[] values) {\n}",
            cpp: "int maxData(vector<int>& values) {\n}"
        }
    },
    {
        title: "The Keyword Search Engine",
        difficulty: Difficulty.MEDIUM,
        category: "hashing",
        tags: ["strings", "frequency"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Count the total number of times each query string appears in a large collection of text blocks.",
        constraints: "Texts: 10^4. Queries: 10^3.",
        testCases: [],
        starterCode: {
            python: "def count_keywords(texts, queries):\n    pass",
            javascript: "function countKeywords(texts, queries) {\n}",
            java: "public int[] countKeywords(String[] texts, String[] queries) {\n}",
            cpp: "vector<int> countKeywords(vector<string>& texts, vector<string>& queries) {\n}"
        }
    },
    {
        title: "The Valid Parentheses Path",
        difficulty: Difficulty.MEDIUM,
        category: "stack",
        tags: ["greedy", "matching"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Find the minimum number of parentheses additions needed to make a string of brackets valid.",
        constraints: "Length: [1, 10^5].",
        testCases: [],
        starterCode: {
            python: "def min_additions(s):\n    pass",
            javascript: "function minAdditions(s) {\n}",
            java: "public int minAdditions(String s) {\n}",
            cpp: "int minAdditions(string s) {\n}"
        }
    },
    {
        title: "The Missing Sector Sum",
        difficulty: Difficulty.MEDIUM,
        category: "arrays",
        tags: ["prefix-sum", "equilibrium"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Find an index such that the sum of elements at lower indices is equal to the sum of elements at higher indices.",
        constraints: "N: [1, 10^5].",
        testCases: [],
        starterCode: {
            python: "def find_equilibrium(nums):\n    pass",
            javascript: "function findEquilibrium(nums) {\n}",
            java: "public int findEquilibrium(int[] nums) {\n}",
            cpp: "int findEquilibrium(vector<int>& nums) {\n}"
        }
    },

    // --- HARD ---
    {
        title: "The Maze Runner's Strategy",
        difficulty: Difficulty.HARD,
        category: "dynamic-programming",
        tags: ["grid", "optimization"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Find the maximum reward in a grid where you can move right, down, or diagonally, but diagonal moves have a cost penalty.",
        constraints: "Grid: 500x500.",
        testCases: [],
        starterCode: {
            python: "def solve_maze(grid, penalty):\n    pass",
            javascript: "function solveMaze(grid, penalty) {\n}",
            java: "public int solveMaze(int[][] grid, int penalty) {\n}",
            cpp: "int solveMaze(vector<vector<int>>& grid, int penalty) {\n}"
        }
    },
    {
        title: "The Digital Fortress",
        difficulty: Difficulty.HARD,
        category: "dynamic-programming",
        tags: ["combinatorics", "base-k"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Count the number of N-digit numbers in base K that do not contain two consecutive zeros.",
        constraints: "2 <= K <= 10. 2 <= N <= 18.",
        testCases: [],
        starterCode: {
            python: "def count_numbers(n, k):\n    pass",
            javascript: "function countNumbers(n, k) {\n}",
            java: "public long countNumbers(int n, int k) {\n}",
            cpp: "long long countNumbers(int n, int k) {\n}"
        }
    },
    {
        title: "The Smart City Network",
        difficulty: Difficulty.HARD,
        category: "graphs",
        tags: ["mst", "kruskal"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Connect all nodes in a city with minimum cost, either by building local hubs or connecting to existing roads.",
        constraints: "Nodes: 10^5. Edges: 10^5.",
        testCases: [],
        starterCode: {
            python: "def min_cost(nodes, edges, hub_cost, road_cost):\n    pass",
            javascript: "function minCost(nodes, edges, hubCost, roadCost) {\n}",
            java: "public long minCost(int n, int[][] edges, int hubCost, int roadCost) {\n}",
            cpp: "long long minCost(int n, vector<vector<int>>& edges, int hubCost, int roadCost) {\n}"
        }
    },
    {
        title: "The Typo Cost Strategy",
        difficulty: Difficulty.HARD,
        category: "dynamic-programming",
        tags: ["edit-distance"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Calculate the minimum cost to transform one command string into another using insert, delete, and replace operations with varying weights.",
        constraints: "Length: 2000.",
        testCases: [],
        starterCode: {
            python: "def min_edit_distance(s1, s2, weights):\n    pass",
            javascript: "function minEditDistance(s1, s2, weights) {\n}",
            java: "public int minEditDistance(String s1, String s2, int[] weights) {\n}",
            cpp: "int minEditDistance(string s1, string s2, vector<int>& weights) {\n}"
        }
    },
    {
        title: "The String Decrypter",
        difficulty: Difficulty.HARD,
        category: "recursion",
        tags: ["parsing", "stack"],
        languages: ["python", "javascript", "java", "cpp"],
        description: "Given an encoded string like '3[a2[bc]]', expand it into the full string 'abcbcabcbcabcbc'.",
        constraints: "Length: 1000. Result size: up to 10^5.",
        testCases: [],
        starterCode: {
            python: "def decode_string(s):\n    pass",
            javascript: "function decodeString(s) {\n}",
            java: "public String decodeString(String s) {\n}",
            cpp: "string decodeString(string s) {\n}"
        }
    }
];

async function main() {
    console.log('Seeding recruitment coding challenges...');
    for (const challenge of challenges) {
        const existing = await prisma.codingChallenge.findFirst({
            where: { title: challenge.title }
        });

        if (existing) {
            console.log(`Skipping existing challenge: ${challenge.title}`);
            continue;
        }

        await prisma.codingChallenge.create({
            data: {
                ...challenge,
                testCases: challenge.testCases as any,
                starterCode: challenge.starterCode as any,
                examples: challenge.examples as any
            },
        });
        console.log(`Created challenge: ${challenge.title}`);
    }
    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
