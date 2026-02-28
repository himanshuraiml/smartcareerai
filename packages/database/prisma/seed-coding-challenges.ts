import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// Helpers — starter-code templates
// ──────────────────────────────────────────────────────────────────────────────

const py = (fn: string) => fn.trim();
const js = (fn: string) => fn.trim();
const java = (fn: string) => fn.trim();
const cpp = (fn: string) => fn.trim();

// ──────────────────────────────────────────────────────────────────────────────
// Challenge definitions
// ──────────────────────────────────────────────────────────────────────────────

const challenges = [
    // ── EASY ────────────────────────────────────────────────────────────────────

    {
        title: 'Two Sum',
        difficulty: Difficulty.EASY,
        category: 'arrays',
        tags: ['hash-map', 'arrays', 'classic'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

Return the answer as two space-separated integers (0-indexed).`,
        examples: [
            { input: '2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
            { input: '3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
        ],
        constraints: `• 2 ≤ nums.length ≤ 10^4
• -10^9 ≤ nums[i] ≤ 10^9
• -10^9 ≤ target ≤ 10^9
• Only one valid answer exists.`,
        testCases: [
            { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
            { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
            { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
            { input: '1 2 3 4 5 6 7 8 9 10\n19', expectedOutput: '8 9', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def two_sum(nums, target):
    # Write your solution here
    # Return a list with two indices [i, j]
    pass

data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1])
result = two_sum(nums, target)
print(result[0], result[1])
`),
            javascript: js(`
const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

function twoSum(nums, target) {
    // Write your solution here
    // Return an array with two indices [i, j]
}

const result = twoSum(nums, target);
console.log(result[0] + ' ' + result[1]);
`),
            java: java(`
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = sc.nextInt();
        int[] res = twoSum(nums, target);
        System.out.println(res[0] + " " + res[1]);
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}

int main() {
    string line; getline(cin, line);
    istringstream iss(line);
    vector<int> nums; int x;
    while (iss >> x) nums.push_back(x);
    int target; cin >> target;
    auto res = twoSum(nums, target);
    cout << res[0] << " " << res[1] << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'Palindrome Check',
        difficulty: Difficulty.EASY,
        category: 'strings',
        tags: ['strings', 'two-pointers', 'classic'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given a string \`s\`, return \`true\` if it is a **palindrome**, and \`false\` otherwise.

A palindrome reads the same forward and backward. Consider only **alphanumeric characters** and ignore case.`,
        examples: [
            { input: 'A man a plan a canal Panama', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
            { input: 'race a car', output: 'false', explanation: '"raceacar" is not a palindrome.' },
        ],
        constraints: `• 1 ≤ s.length ≤ 2 × 10^5
• s consists only of printable ASCII characters.`,
        testCases: [
            { input: 'A man a plan a canal Panama', expectedOutput: 'true', isHidden: false },
            { input: 'race a car', expectedOutput: 'false', isHidden: false },
            { input: ' ', expectedOutput: 'true', isHidden: false },
            { input: 'Was it a car or a cat I saw', expectedOutput: 'true', isHidden: true },
            { input: 'hello', expectedOutput: 'false', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def is_palindrome(s):
    # Write your solution here
    # Return True or False
    pass

s = sys.stdin.read().strip()
print(str(is_palindrome(s)).lower())
`),
            javascript: js(`
const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

function isPalindrome(s) {
    // Write your solution here
    // Return true or false
}

console.log(isPalindrome(s).toString());
`),
            java: java(`
import java.util.*;

public class Main {
    public static boolean isPalindrome(String s) {
        // Write your solution here
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(isPalindrome(s));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

bool isPalindrome(string s) {
    // Write your solution here
    return false;
}

int main() {
    string s;
    getline(cin, s);
    cout << (isPalindrome(s) ? "true" : "false") << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'FizzBuzz',
        difficulty: Difficulty.EASY,
        category: 'math',
        tags: ['loops', 'modulo', 'classic'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given an integer \`n\`, print numbers from \`1\` to \`n\` (each on a new line) with the following rules:

- If the number is divisible by **3**, print \`Fizz\`
- If the number is divisible by **5**, print \`Buzz\`
- If the number is divisible by **both 3 and 5**, print \`FizzBuzz\`
- Otherwise, print the number itself`,
        examples: [
            { input: '5', output: '1\n2\nFizz\n4\nBuzz', explanation: '3→Fizz, 5→Buzz' },
            { input: '15', output: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', explanation: '15 is divisible by both 3 and 5' },
        ],
        constraints: '• 1 ≤ n ≤ 10^4',
        testCases: [
            { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false },
            { input: '3', expectedOutput: '1\n2\nFizz', isHidden: false },
            { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: true },
            { input: '1', expectedOutput: '1', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def fizzbuzz(n):
    # Write your solution here
    # Print each result on a new line
    pass

n = int(sys.stdin.read().strip())
fizzbuzz(n)
`),
            javascript: js(`
const n = parseInt(require('fs').readFileSync('/dev/stdin', 'utf8').trim());

function fizzBuzz(n) {
    // Write your solution here
    // Print each result using console.log()
}

fizzBuzz(n);
`),
            java: java(`
import java.util.*;

public class Main {
    public static void fizzBuzz(int n) {
        // Write your solution here
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        fizzBuzz(sc.nextInt());
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

void fizzBuzz(int n) {
    // Write your solution here
}

int main() {
    int n; cin >> n;
    fizzBuzz(n);
    return 0;
}
`),
        },
    },

    {
        title: 'Reverse a String',
        difficulty: Difficulty.EASY,
        category: 'strings',
        tags: ['strings', 'two-pointers'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given a string \`s\`, return the **reversed** version of the string.

Do not use any built-in reverse functions.`,
        examples: [
            { input: 'hello', output: 'olleh' },
            { input: 'OpenAI', output: 'IAnepO' },
        ],
        constraints: '• 1 ≤ s.length ≤ 10^5',
        testCases: [
            { input: 'hello', expectedOutput: 'olleh', isHidden: false },
            { input: 'OpenAI', expectedOutput: 'IAnepO', isHidden: false },
            { input: 'a', expectedOutput: 'a', isHidden: true },
            { input: 'abcdefghij', expectedOutput: 'jihgfedcba', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def reverse_string(s):
    # Write your solution here (do not use s[::-1] or reversed())
    pass

s = sys.stdin.read().strip()
print(reverse_string(s))
`),
            javascript: js(`
const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

function reverseString(s) {
    // Write your solution here (do not use .reverse())
}

console.log(reverseString(s));
`),
            java: java(`
import java.util.*;

public class Main {
    public static String reverseString(String s) {
        // Write your solution here
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(reverseString(sc.nextLine()));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

string reverseString(string s) {
    // Write your solution here (do not use reverse())
    return "";
}

int main() {
    string s; getline(cin, s);
    cout << reverseString(s) << endl;
    return 0;
}
`),
        },
    },

    // ── MEDIUM ───────────────────────────────────────────────────────────────────

    {
        title: 'Valid Parentheses',
        difficulty: Difficulty.MEDIUM,
        category: 'stacks',
        tags: ['stack', 'strings', 'classic'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given a string \`s\` containing only the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is **valid**.

A string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket.`,
        examples: [
            { input: '()', output: 'true' },
            { input: '()[]{} ', output: 'true' },
            { input: '(]', output: 'false' },
            { input: '([)]', output: 'false', explanation: 'Brackets are not closed in correct order.' },
        ],
        constraints: `• 1 ≤ s.length ≤ 10^4
• s consists of parentheses only '()[]{}'`,
        testCases: [
            { input: '()', expectedOutput: 'true', isHidden: false },
            { input: '()[]{} ', expectedOutput: 'true', isHidden: false },
            { input: '(]', expectedOutput: 'false', isHidden: false },
            { input: '([)]', expectedOutput: 'false', isHidden: true },
            { input: '{[]}', expectedOutput: 'true', isHidden: true },
            { input: '((((((', expectedOutput: 'false', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def is_valid(s):
    # Write your solution here
    # Return True or False
    pass

s = sys.stdin.read().strip()
print(str(is_valid(s)).lower())
`),
            javascript: js(`
const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

function isValid(s) {
    // Write your solution here
    // Return true or false
}

console.log(isValid(s).toString());
`),
            java: java(`
import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        // Write your solution here
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(isValid(sc.nextLine().trim()));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

bool isValid(string s) {
    // Write your solution here
    return false;
}

int main() {
    string s; getline(cin, s);
    // trim whitespace
    s.erase(remove_if(s.begin(), s.end(), ::isspace), s.end());
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'Binary Search',
        difficulty: Difficulty.MEDIUM,
        category: 'sorting',
        tags: ['binary-search', 'arrays', 'divide-and-conquer'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given an array of integers \`nums\` **sorted in ascending order** and an integer \`target\`, implement **binary search** and return the index of \`target\`.

If \`target\` is not found, return \`-1\`.

You must write an algorithm with **O(log n)** runtime complexity.`,
        examples: [
            { input: '-1 0 3 5 9 12\n9', output: '4', explanation: '9 exists at index 4' },
            { input: '-1 0 3 5 9 12\n2', output: '-1', explanation: '2 does not exist in nums' },
        ],
        constraints: `• 1 ≤ nums.length ≤ 10^4
• -10^4 < nums[i], target < 10^4
• All integers in nums are unique.
• nums is sorted in ascending order.`,
        testCases: [
            { input: '-1 0 3 5 9 12\n9', expectedOutput: '4', isHidden: false },
            { input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', isHidden: false },
            { input: '5\n5', expectedOutput: '0', isHidden: true },
            { input: '1 2 3 4 5 6 7 8 9 10\n7', expectedOutput: '6', isHidden: true },
            { input: '1 3 5 7 9 11 13\n0', expectedOutput: '-1', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def binary_search(nums, target):
    # Write your solution here using O(log n) approach
    # Return the index or -1
    pass

data = sys.stdin.read().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1])
print(binary_search(nums, target))
`),
            javascript: js(`
const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = parseInt(lines[1]);

function binarySearch(nums, target) {
    // Write your solution here using O(log n) approach
    // Return the index or -1
}

console.log(binarySearch(nums, target));
`),
            java: java(`
import java.util.*;

public class Main {
    public static int binarySearch(int[] nums, int target) {
        // Write your solution here using O(log n) approach
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(" ");
        int[] nums = Arrays.stream(parts).mapToInt(Integer::parseInt).toArray();
        int target = sc.nextInt();
        System.out.println(binarySearch(nums, target));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

int binarySearch(vector<int>& nums, int target) {
    // Write your solution here using O(log n) approach
    return -1;
}

int main() {
    string line; getline(cin, line);
    istringstream iss(line);
    vector<int> nums; int x;
    while (iss >> x) nums.push_back(x);
    int target; cin >> target;
    cout << binarySearch(nums, target) << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'Longest Common Prefix',
        difficulty: Difficulty.MEDIUM,
        category: 'strings',
        tags: ['strings', 'sorting'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Write a function to find the **longest common prefix** string among an array of strings.

If there is no common prefix, return an empty string \`""\`.

Input: space-separated list of words on one line.`,
        examples: [
            { input: 'flower flow flight', output: 'fl' },
            { input: 'dog racecar car', output: '', explanation: 'No common prefix.' },
        ],
        constraints: `• 1 ≤ strs.length ≤ 200
• 0 ≤ strs[i].length ≤ 200
• strs[i] consists of only lowercase English letters.`,
        testCases: [
            { input: 'flower flow flight', expectedOutput: 'fl', isHidden: false },
            { input: 'dog racecar car', expectedOutput: '', isHidden: false },
            { input: 'interview interviewee interviewer', expectedOutput: 'interview', isHidden: true },
            { input: 'abc abc abc', expectedOutput: 'abc', isHidden: true },
            { input: 'a', expectedOutput: 'a', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def longest_common_prefix(strs):
    # Write your solution here
    # Return the longest common prefix string
    pass

words = sys.stdin.read().strip().split()
result = longest_common_prefix(words)
print(result)
`),
            javascript: js(`
const words = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(' ');

function longestCommonPrefix(strs) {
    // Write your solution here
    // Return the longest common prefix string
}

console.log(longestCommonPrefix(words));
`),
            java: java(`
import java.util.*;

public class Main {
    public static String longestCommonPrefix(String[] strs) {
        // Write your solution here
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] strs = sc.nextLine().split(" ");
        System.out.println(longestCommonPrefix(strs));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

string longestCommonPrefix(vector<string>& strs) {
    // Write your solution here
    return "";
}

int main() {
    string line; getline(cin, line);
    istringstream iss(line);
    vector<string> strs; string w;
    while (iss >> w) strs.push_back(w);
    cout << longestCommonPrefix(strs) << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'Maximum Subarray (Kadane\'s Algorithm)',
        difficulty: Difficulty.MEDIUM,
        category: 'dynamic-programming',
        tags: ['dynamic-programming', 'arrays', 'greedy'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given an integer array \`nums\`, find the **contiguous subarray** (containing at least one number) which has the **largest sum** and return its sum.

A subarray is a contiguous part of an array.`,
        examples: [
            { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', explanation: '[4, -1, 2, 1] has the largest sum = 6.' },
            { input: '1', output: '1' },
            { input: '5 4 -1 7 8', output: '23' },
        ],
        constraints: `• 1 ≤ nums.length ≤ 10^5
• -10^4 ≤ nums[i] ≤ 10^4`,
        testCases: [
            { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
            { input: '1', expectedOutput: '1', isHidden: false },
            { input: '5 4 -1 7 8', expectedOutput: '23', isHidden: false },
            { input: '-1 -2 -3 -4', expectedOutput: '-1', isHidden: true },
            { input: '-2 -1', expectedOutput: '-1', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def max_subarray(nums):
    # Write your solution here (hint: Kadane's algorithm)
    # Return the maximum subarray sum
    pass

nums = list(map(int, sys.stdin.read().split()))
print(max_subarray(nums))
`),
            javascript: js(`
const nums = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split(' ').map(Number);

function maxSubArray(nums) {
    // Write your solution here (hint: Kadane's algorithm)
    // Return the maximum subarray sum
}

console.log(maxSubArray(nums));
`),
            java: java(`
import java.util.*;

public class Main {
    public static int maxSubArray(int[] nums) {
        // Write your solution here (hint: Kadane's algorithm)
        return Integer.MIN_VALUE;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().split(" ")).mapToInt(Integer::parseInt).toArray();
        System.out.println(maxSubArray(nums));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

int maxSubArray(vector<int>& nums) {
    // Write your solution here (hint: Kadane's algorithm)
    return INT_MIN;
}

int main() {
    string line; getline(cin, line);
    istringstream iss(line);
    vector<int> nums; int x;
    while (iss >> x) nums.push_back(x);
    cout << maxSubArray(nums) << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'Climbing Stairs',
        difficulty: Difficulty.MEDIUM,
        category: 'dynamic-programming',
        tags: ['dynamic-programming', 'memoization', 'fibonacci'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb **1 or 2 steps**. In how many distinct ways can you climb to the top?`,
        examples: [
            { input: '2', output: '2', explanation: 'Two ways: (1,1) or (2)' },
            { input: '3', output: '3', explanation: 'Three ways: (1,1,1), (1,2), (2,1)' },
        ],
        constraints: '• 1 ≤ n ≤ 45',
        testCases: [
            { input: '2', expectedOutput: '2', isHidden: false },
            { input: '3', expectedOutput: '3', isHidden: false },
            { input: '10', expectedOutput: '89', isHidden: true },
            { input: '45', expectedOutput: '1836311903', isHidden: true },
            { input: '1', expectedOutput: '1', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def climb_stairs(n):
    # Write your solution here
    # Return the number of distinct ways
    pass

n = int(sys.stdin.read().strip())
print(climb_stairs(n))
`),
            javascript: js(`
const n = parseInt(require('fs').readFileSync('/dev/stdin', 'utf8').trim());

function climbStairs(n) {
    // Write your solution here
    // Return the number of distinct ways
}

console.log(climbStairs(n));
`),
            java: java(`
import java.util.*;

public class Main {
    public static int climbStairs(int n) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(climbStairs(sc.nextInt()));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

int climbStairs(int n) {
    // Write your solution here
    return 0;
}

int main() {
    int n; cin >> n;
    cout << climbStairs(n) << endl;
    return 0;
}
`),
        },
    },

    // ── HARD ─────────────────────────────────────────────────────────────────────

    {
        title: 'Longest Substring Without Repeating Characters',
        difficulty: Difficulty.HARD,
        category: 'strings',
        tags: ['sliding-window', 'hash-map', 'strings'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
        examples: [
            { input: 'abcabcbb', output: '3', explanation: 'The answer is "abc", with length 3.' },
            { input: 'bbbbb', output: '1', explanation: 'The answer is "b", with length 1.' },
            { input: 'pwwkew', output: '3', explanation: 'The answer is "wke", with length 3.' },
        ],
        constraints: `• 0 ≤ s.length ≤ 5 × 10^4
• s consists of English letters, digits, symbols and spaces.`,
        testCases: [
            { input: 'abcabcbb', expectedOutput: '3', isHidden: false },
            { input: 'bbbbb', expectedOutput: '1', isHidden: false },
            { input: 'pwwkew', expectedOutput: '3', isHidden: false },
            { input: '', expectedOutput: '0', isHidden: true },
            { input: 'dvdf', expectedOutput: '3', isHidden: true },
            { input: 'aab', expectedOutput: '2', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def length_of_longest_substring(s):
    # Write your solution here (hint: sliding window + hash map)
    # Return the length of the longest substring without repeating characters
    pass

s = sys.stdin.read().strip()
print(length_of_longest_substring(s))
`),
            javascript: js(`
const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

function lengthOfLongestSubstring(s) {
    // Write your solution here (hint: sliding window + hash map)
    // Return the length
}

console.log(lengthOfLongestSubstring(s));
`),
            java: java(`
import java.util.*;

public class Main {
    public static int lengthOfLongestSubstring(String s) {
        // Write your solution here (hint: sliding window + hash map)
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(lengthOfLongestSubstring(s));
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

int lengthOfLongestSubstring(string s) {
    // Write your solution here (hint: sliding window + hash map)
    return 0;
}

int main() {
    string s;
    getline(cin, s);
    cout << lengthOfLongestSubstring(s) << endl;
    return 0;
}
`),
        },
    },

    {
        title: 'Word Frequency Counter',
        difficulty: Difficulty.HARD,
        category: 'strings',
        tags: ['hash-map', 'sorting', 'strings'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given a paragraph of text, find the **top k most frequent words**.

Input format:
- Line 1: \`k\` (number of top words to return)
- Line 2+: The paragraph (may span multiple lines)

Output the top \`k\` words in **descending frequency order**, one per line.
If two words have the same frequency, sort them **alphabetically** (ascending).

Ignore punctuation and treat words case-insensitively.`,
        examples: [
            {
                input: '3\nthe sky is blue the sky is blue the sky',
                output: 'the\nsky\nis',
                explanation: 'the=3, sky=3, is=2, blue=2. sky < the alphabetically so: the, sky, is',
            },
        ],
        constraints: `• 1 ≤ k ≤ 500
• 1 ≤ paragraph.length ≤ 5000
• The paragraph contains English letters and spaces.`,
        testCases: [
            { input: '3\nthe sky is blue the sky is blue the sky', expectedOutput: 'the\nsky\nis', isHidden: false },
            { input: '2\nhello world hello', expectedOutput: 'hello\nworld', isHidden: false },
            { input: '1\na a a b b c', expectedOutput: 'a', isHidden: true },
            { input: '2\ni love coding and i love algorithms', expectedOutput: 'i\nlove', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def top_k_words(k, text):
    # Write your solution here
    # Return a list of the top k words
    pass

data = sys.stdin.read().split('\\n')
k = int(data[0])
text = ' '.join(data[1:])
result = top_k_words(k, text)
print('\\n'.join(result))
`),
            javascript: js(`
const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const k = parseInt(lines[0]);
const text = lines.slice(1).join(' ');

function topKWords(k, text) {
    // Write your solution here
    // Return an array of the top k words
}

console.log(topKWords(k, text).join('\\n'));
`),
            java: java(`
import java.util.*;

public class Main {
    public static List<String> topKWords(int k, String text) {
        // Write your solution here
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int k = Integer.parseInt(sc.nextLine());
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) sb.append(sc.nextLine()).append(' ');
        List<String> result = topKWords(k, sb.toString().trim());
        result.forEach(System.out::println);
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

vector<string> topKWords(int k, string text) {
    // Write your solution here
    return {};
}

int main() {
    int k; cin >> k; cin.ignore();
    string line, text;
    while (getline(cin, line)) text += line + " ";
    auto result = topKWords(k, text);
    for (auto& w : result) cout << w << "\\n";
    return 0;
}
`),
        },
    },

    {
        title: 'Merge Intervals',
        difficulty: Difficulty.HARD,
        category: 'arrays',
        tags: ['sorting', 'arrays', 'intervals'],
        languages: ['python', 'javascript', 'java', 'cpp'],
        description: `Given an array of intervals where \`intervals[i] = [start_i, end_i]\`, merge all **overlapping intervals** and return an array of the non-overlapping intervals that cover all the intervals in the input.

Input: each interval on one line as \`start end\`. Output: merged intervals, each on a new line.`,
        examples: [
            { input: '1 3\n2 6\n8 10\n15 18', output: '1 6\n8 10\n15 18', explanation: '[1,3] and [2,6] overlap → merged to [1,6].' },
            { input: '1 4\n4 5', output: '1 5', explanation: '[1,4] and [4,5] are considered overlapping.' },
        ],
        constraints: `• 1 ≤ intervals.length ≤ 10^4
• intervals[i].length == 2
• 0 ≤ start_i ≤ end_i ≤ 10^4`,
        testCases: [
            { input: '1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isHidden: false },
            { input: '1 4\n4 5', expectedOutput: '1 5', isHidden: false },
            { input: '1 4', expectedOutput: '1 4', isHidden: true },
            { input: '1 4\n2 3', expectedOutput: '1 4', isHidden: true },
            { input: '1 2\n3 4\n5 6', expectedOutput: '1 2\n3 4\n5 6', isHidden: true },
        ],
        starterCode: {
            python: py(`
import sys

def merge_intervals(intervals):
    # Write your solution here
    # Return a list of merged [start, end] pairs
    pass

lines = sys.stdin.read().strip().split('\\n')
intervals = [list(map(int, l.split())) for l in lines]
result = merge_intervals(intervals)
for r in result:
    print(r[0], r[1])
`),
            javascript: js(`
const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const intervals = lines.map(l => l.split(' ').map(Number));

function mergeIntervals(intervals) {
    // Write your solution here
    // Return array of merged intervals [[start, end], ...]
}

mergeIntervals(intervals).forEach(r => console.log(r[0] + ' ' + r[1]));
`),
            java: java(`
import java.util.*;

public class Main {
    public static int[][] mergeIntervals(int[][] intervals) {
        // Write your solution here
        return new int[][]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        List<int[]> list = new ArrayList<>();
        while (sc.hasNextInt()) list.add(new int[]{sc.nextInt(), sc.nextInt()});
        int[][] result = mergeIntervals(list.toArray(new int[0][]));
        for (int[] r : result) System.out.println(r[0] + " " + r[1]);
    }
}
`),
            cpp: cpp(`
#include <bits/stdc++.h>
using namespace std;

vector<pair<int,int>> mergeIntervals(vector<pair<int,int>>& intervals) {
    // Write your solution here
    return {};
}

int main() {
    vector<pair<int,int>> intervals;
    int a, b;
    while (cin >> a >> b) intervals.push_back({a, b});
    auto result = mergeIntervals(intervals);
    for (auto& r : result) cout << r.first << " " << r.second << "\\n";
    return 0;
}
`),
        },
    },
];

// ──────────────────────────────────────────────────────────────────────────────
// Seed function
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🧩 Seeding coding challenges...\n');

    let created = 0;
    let skipped = 0;

    for (const ch of challenges) {
        const existing = await prisma.codingChallenge.findFirst({
            where: { title: ch.title },
            select: { id: true },
        });

        if (existing) {
            console.log(`  ⏭  Skipped (already exists): ${ch.title}`);
            skipped++;
            continue;
        }

        await prisma.codingChallenge.create({
            data: {
                title: ch.title,
                description: ch.description,
                difficulty: ch.difficulty,
                category: ch.category,
                tags: ch.tags,
                languages: ch.languages,
                starterCode: ch.starterCode,
                testCases: ch.testCases,
                examples: ch.examples ?? [],
                constraints: ch.constraints ?? null,
                timeLimit: 5,
                memoryLimit: 128,
                isActive: true,
            },
        });

        const badge = ch.difficulty === 'EASY' ? '🟢' : ch.difficulty === 'MEDIUM' ? '🟡' : '🔴';
        console.log(`  ${badge} Created: ${ch.title} [${ch.difficulty}]`);
        created++;
    }

    console.log(`\n✅ Done — ${created} created, ${skipped} skipped.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
