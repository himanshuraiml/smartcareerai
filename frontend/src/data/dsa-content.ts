// DSA Guide — complete topic content for all 32 topics
// Each topic contains: intuition, approach, complexity, code, patterns, edgeCases, leetcodeProblems, comparison

export interface CodeExample {
  language: 'python' | 'javascript' | 'java';
  code: string;
}

export interface LeetCodeProblem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
}

export interface TopicContent {
  intuition: string;
  whenToUse: string[];
  approach: { step: number; text: string }[];
  timeComplexity: string;
  spaceComplexity: string;
  complexityNote: string;
  code: CodeExample;
  annotations: { line: string; note: string }[];
  patterns: { name: string; description: string }[];
  edgeCases: string[];
  leetcodeProblems: LeetCodeProblem[];
  comparison?: { technique: string; useWhen: string }[];
  interviewTips: string[];
}

export const DSA_CONTENT: Record<string, TopicContent> = {

  /* ──────────────────────────────────────────────
     ARRAYS & STRINGS
  ────────────────────────────────────────────── */

  'two-pointers': {
    intuition: `Two Pointers is the pattern where you maintain two indices (left, right) that move toward or away from each other — or both move in the same direction — to process the array in a single O(n) pass instead of the brute-force O(n²) nested loops.

Think of it like two runners on a track: one starts at the beginning, one at the end. They walk toward each other, and every time they meet you've either found your answer or eliminated a chunk of possibilities.`,
    whenToUse: [
      'Sorted array / two-sum type problems',
      'Palindrome checks',
      'Removing duplicates in-place',
      'Container / area problems',
      'Comparing characters from both ends of a string',
    ],
    approach: [
      { step: 1, text: 'Place left pointer at index 0, right at index n-1 (or wherever makes sense for the problem).' },
      { step: 2, text: 'Evaluate the current pair — check the condition (sum, product, palindrome equality, etc.).' },
      { step: 3, text: 'Move the pointer that will bring you closer to the target. If sum is too large, move right ←. If too small, move left →.' },
      { step: 4, text: 'Repeat until left >= right (or the two pointers meet).' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'One full pass over the array; no extra data structures needed beyond the two index variables.',
    code: {
      language: 'python',
      code: `def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    left, right = 0, len(nums) - 1

    while left < right:
        current_sum = nums[left] + nums[right]

        if current_sum == target:
            return [left, right]          # ✅ found the pair
        elif current_sum < target:
            left += 1                     # need a bigger number → move left right
        else:
            right -= 1                    # need a smaller number → move right left

    return []  # no pair found


# ── Palindrome check variant ──────────────────────
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True


# ── Remove duplicates in-place ────────────────────
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    slow = 0                              # slow tracks write position
    for fast in range(1, len(nums)):      # fast scans every element
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1                       # length of unique portion`,
    },
    annotations: [
      { line: 'left, right = 0, len(nums) - 1', note: 'Initialize pointers at opposite ends. Works only on sorted arrays.' },
      { line: 'current_sum < target', note: 'Sum is too small → we need a larger number → advance the left pointer.' },
      { line: 'slow = 0', note: 'Slow pointer is the "write head" — it only advances when a unique element is found.' },
      { line: 'for fast in range(1, len(nums))', note: 'Fast pointer scans every element, slow only moves on discovery.' },
    ],
    patterns: [
      { name: 'Opposite-direction (converging)', description: 'Left starts at 0, right at n-1; both move inward. Best for sorted arrays, palindromes, container problems.' },
      { name: 'Same-direction (slow-fast)', description: 'Both start at 0; fast races ahead. Best for in-place removal, finding cycle entry points.' },
      { name: 'Pointer from different arrays', description: 'One pointer per sorted array, used in merge operations.' },
    ],
    edgeCases: [
      'Empty array → return immediately',
      'Single element → no pair possible',
      'All identical elements → e.g. remove-duplicates should return length 1',
      'Target larger than any possible sum or smaller than any possible sum',
      'Negative numbers — works fine on sorted arrays, same logic applies',
    ],
    leetcodeProblems: [
      { id: 167, title: 'Two Sum II – Input Array Is Sorted', difficulty: 'Medium', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/' },
      { id: 125, title: 'Valid Palindrome', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-palindrome/' },
      { id: 11, title: 'Container With Most Water', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/' },
      { id: 26, title: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/' },
      { id: 15, title: '3Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/' },
      { id: 42, title: 'Trapping Rain Water', difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water/' },
    ],
    comparison: [
      { technique: 'Two Pointers', useWhen: 'Array is sorted OR you\'re checking both ends simultaneously' },
      { technique: 'Hash Map', useWhen: 'Array is unsorted and you need O(1) lookups by value' },
      { technique: 'Sliding Window', useWhen: 'You need a contiguous subarray of dynamic/fixed size' },
    ],
    interviewTips: [
      'Always confirm whether the array is sorted — Two Pointers usually requires it for converging variant.',
      'Draw the pointer positions on paper for the first 2-3 steps; this instantly clarifies the logic.',
      'For "3Sum", sort first, then apply Two Pointers inside a loop — classic combination.',
      'Mention time complexity upfront: "This is O(n) because each element is visited at most once."',
    ],
  },

  'sliding-window': {
    intuition: `Sliding Window is the pattern for finding a contiguous subarray or substring that satisfies some condition — max sum, longest without repeating chars, minimum length, etc. Instead of recalculating from scratch for each subarray, you "slide" a window across: add the new right element, remove the old left element. Think of it like a train window sliding along a track.

There are two variants: Fixed-size (k elements always) and Variable-size (expand right, shrink left until valid).`,
    whenToUse: [
      'Longest/shortest subarray with a condition',
      'Fixed-size window max/min/sum',
      'Substring with at most K distinct characters',
      'Anagram / permutation in string',
      'Minimum window substring',
    ],
    approach: [
      { step: 1, text: 'Initialize left = 0, right = 0, and any window state (sum, freq map, etc.).' },
      { step: 2, text: 'Expand: move right forward, adding nums[right] to window state.' },
      { step: 3, text: 'Shrink: while window is invalid, move left forward and remove nums[left] from state.' },
      { step: 4, text: 'Record answer (max length, min length, etc.) after each valid window.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(k) — k is the size of the window state (freq map)',
    complexityNote: 'Each element is added to and removed from the window at most once, giving O(n) total.',
    code: {
      language: 'python',
      code: `from collections import defaultdict

# ── Variable window: Longest substring with at most K distinct chars ──
def length_of_longest_substring_k_distinct(s: str, k: int) -> int:
    freq = defaultdict(int)
    left = 0
    result = 0

    for right in range(len(s)):
        freq[s[right]] += 1               # expand: add right character

        while len(freq) > k:              # shrink: too many distinct chars
            freq[s[left]] -= 1
            if freq[s[left]] == 0:
                del freq[s[left]]
            left += 1

        result = max(result, right - left + 1)

    return result


# ── Fixed window: Max sum of subarray of size k ──
def max_sum_fixed(nums: list[int], k: int) -> int:
    window_sum = sum(nums[:k])            # initial window
    best = window_sum

    for i in range(k, len(nums)):
        window_sum += nums[i]             # add incoming element
        window_sum -= nums[i - k]         # remove outgoing element
        best = max(best, window_sum)

    return best


# ── Minimum window substring (hard variant) ──
def min_window(s: str, t: str) -> str:
    need = defaultdict(int)
    for c in t:
        need[c] += 1

    missing = len(t)
    left = start = 0
    end = float('inf')

    for right, c in enumerate(s, 1):
        if need[c] > 0:
            missing -= 1
        need[c] -= 1

        if missing == 0:                  # valid window found
            while need[s[left]] < 0:     # shrink from left
                need[s[left]] += 1
                left += 1
            if right - left < end - start:
                start, end = left, right
            need[s[left]] += 1
            missing += 1
            left += 1

    return s[start:end] if end != float('inf') else ""`,
    },
    annotations: [
      { line: 'freq[s[right]] += 1', note: 'Expand right — register the new character into our window frequency map.' },
      { line: 'while len(freq) > k', note: 'Window is invalid. Shrink from the left until it becomes valid again.' },
      { line: 'window_sum += nums[i]; window_sum -= nums[i - k]', note: 'Fixed window slide: add new right, subtract old left. O(1) update.' },
      { line: 'if need[c] > 0: missing -= 1', note: 'Count only "useful" characters. Once missing == 0, we have a valid window.' },
    ],
    patterns: [
      { name: 'Fixed-size window', description: 'Window size k stays constant. Use: max/min sum, moving average, k-consecutive.' },
      { name: 'Variable-size (shrink on violation)', description: 'Expand right freely; shrink left when constraint is violated. Use: longest substring problems.' },
      { name: 'Variable-size (shrink for minimum)', description: 'Contract left as much as possible while window is still valid. Use: minimum length subarray.' },
    ],
    edgeCases: [
      'k > len(s) — window larger than array, return full array or -1',
      'All identical characters — window never shrinks',
      'Empty string — return 0 immediately',
      'k = 0 — edge case depending on problem definition',
      'Unicode characters in substring problems',
    ],
    leetcodeProblems: [
      { id: 643, title: 'Maximum Average Subarray I', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-average-subarray-i/' },
      { id: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
      { id: 567, title: 'Permutation in String', difficulty: 'Medium', url: 'https://leetcode.com/problems/permutation-in-string/' },
      { id: 76, title: 'Minimum Window Substring', difficulty: 'Hard', url: 'https://leetcode.com/problems/minimum-window-substring/' },
      { id: 239, title: 'Sliding Window Maximum', difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/' },
    ],
    comparison: [
      { technique: 'Sliding Window', useWhen: 'Contiguous subarray / substring problems' },
      { technique: 'Two Pointers', useWhen: 'Pair-finding in sorted arrays (not subarray)' },
      { technique: 'Prefix Sum', useWhen: 'Non-contiguous range queries or cumulative sums' },
    ],
    interviewTips: [
      'Identify whether the window is fixed or variable before coding.',
      'Clearly state what "valid" means for the window — that\'s the core of the problem.',
      'For frequency problems, use a Counter / defaultdict to track window state.',
      'The answer is updated after confirming window validity, never inside the shrink loop.',
    ],
  },

  'prefix-sum': {
    intuition: `Prefix Sum precomputes cumulative sums so any range query [l, r] is answered in O(1): prefix[r+1] - prefix[l]. The trick is building an auxiliary array where prefix[i] = sum of nums[0..i-1].

Imagine the array is a road and prefix[i] is the total distance traveled from start to position i. The distance of any segment is just end_distance - start_distance.`,
    whenToUse: [
      'Range sum queries (many queries on static array)',
      'Subarray sum equals K',
      'Count subarrays with given XOR or remainder',
      '2D grid sum queries',
      'Finding pivot index',
    ],
    approach: [
      { step: 1, text: 'Build prefix array: prefix[0] = 0, prefix[i] = prefix[i-1] + nums[i-1].' },
      { step: 2, text: 'Answer range query [l, r] as prefix[r+1] - prefix[l] in O(1).' },
      { step: 3, text: 'For "subarray sum = K", use a hash map storing {prefix_sum: count}; at each index check if (current_prefix - k) exists.' },
    ],
    timeComplexity: 'O(n) build + O(1) per query',
    spaceComplexity: 'O(n)',
    complexityNote: 'One-time O(n) preprocessing unlocks O(1) answers to arbitrarily many range queries.',
    code: {
      language: 'python',
      code: `# ── Basic prefix sum ──────────────────────────────
def build_prefix(nums: list[int]) -> list[int]:
    prefix = [0] * (len(nums) + 1)
    for i, v in enumerate(nums):
        prefix[i + 1] = prefix[i] + v
    return prefix

def range_sum(prefix: list[int], l: int, r: int) -> int:
    return prefix[r + 1] - prefix[l]   # O(1) range query


# ── Subarray sum equals K ─────────────────────────
from collections import defaultdict

def subarray_sum_equals_k(nums: list[int], k: int) -> int:
    count = 0
    prefix = 0
    seen = defaultdict(int)
    seen[0] = 1                         # empty prefix sums to 0

    for num in nums:
        prefix += num
        count += seen[prefix - k]       # how many prior prefixes = prefix - k?
        seen[prefix] += 1

    return count


# ── 2D prefix sum ─────────────────────────────────
def build_2d_prefix(matrix: list[list[int]]) -> list[list[int]]:
    m, n = len(matrix), len(matrix[0])
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            dp[i][j] = (matrix[i-1][j-1]
                        + dp[i-1][j]
                        + dp[i][j-1]
                        - dp[i-1][j-1])
    return dp

def range_sum_2d(dp, r1, c1, r2, c2):
    return (dp[r2+1][c2+1] - dp[r1][c2+1]
            - dp[r2+1][c1] + dp[r1][c1])`,
    },
    annotations: [
      { line: 'prefix = [0] * (len(nums) + 1)', note: 'Extra element at front (sentinel) avoids edge-case handling for index 0.' },
      { line: 'seen[0] = 1', note: 'An empty prefix has sum 0. This handles subarrays starting at index 0.' },
      { line: 'count += seen[prefix - k]', note: 'If prefix[j] - prefix[i] == k, then nums[i..j] has sum k. seen stores how many such i exist.' },
    ],
    patterns: [
      { name: 'Static range query', description: 'Build once, query many times. Classic prefix sum.' },
      { name: 'Subarray sum counting', description: 'Combine prefix sum with a hash map to count subarrays with given sum / XOR / remainder.' },
      { name: '2D prefix sum', description: 'Extend to matrices for O(1) rectangle sum queries.' },
    ],
    edgeCases: [
      'Negative numbers — prefix sum still works correctly',
      'k = 0 — counts subarrays that sum to zero (valid!)',
      'All zeros — every subarray qualifies',
      'Single element array',
      '2D: empty matrix or single row/column',
    ],
    leetcodeProblems: [
      { id: 303, title: 'Range Sum Query - Immutable', difficulty: 'Easy', url: 'https://leetcode.com/problems/range-sum-query-immutable/' },
      { id: 724, title: 'Find Pivot Index', difficulty: 'Easy', url: 'https://leetcode.com/problems/find-pivot-index/' },
      { id: 560, title: 'Subarray Sum Equals K', difficulty: 'Medium', url: 'https://leetcode.com/problems/subarray-sum-equals-k/' },
      { id: 304, title: 'Range Sum Query 2D - Immutable', difficulty: 'Medium', url: 'https://leetcode.com/problems/range-sum-query-2d-immutable/' },
      { id: 1480, title: 'Running Sum of 1d Array', difficulty: 'Easy', url: 'https://leetcode.com/problems/running-sum-of-1d-array/' },
    ],
    interviewTips: [
      'The sentinel zero at prefix[0] is crucial — always add it.',
      'For "count subarrays with sum K", immediately think prefix sum + hash map.',
      'Mention the trade-off: O(n) space for O(1) query speed.',
      'For 2D, the inclusion-exclusion formula is easy to derive on a whiteboard.',
    ],
  },

  'kadane': {
    intuition: `Kadane's Algorithm finds the maximum sum contiguous subarray in O(n). The key insight: at each position, you choose whether to extend the previous subarray or start fresh. If adding the current element to the ongoing sum makes it negative, it\'s always better to restart from zero.

Think of it as a running score: keep accumulating, but reset when the running total goes negative — a negative "tail" can only hurt any future subarray.`,
    whenToUse: [
      'Maximum subarray sum',
      'Maximum product subarray (modified variant)',
      'Circular array maximum subarray',
      'Maximum sum rectangle in a 2D matrix',
    ],
    approach: [
      { step: 1, text: 'Initialize max_ending_here = max_so_far = nums[0].' },
      { step: 2, text: 'For each element from index 1: max_ending_here = max(nums[i], max_ending_here + nums[i]).' },
      { step: 3, text: 'Update max_so_far = max(max_so_far, max_ending_here).' },
      { step: 4, text: 'Return max_so_far.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'Single pass, only two variables maintained.',
    code: {
      language: 'python',
      code: `# ── Classic Kadane ────────────────────────────────
def max_subarray(nums: list[int]) -> int:
    cur = best = nums[0]

    for num in nums[1:]:
        cur = max(num, cur + num)         # extend OR restart
        best = max(best, cur)

    return best


# ── With subarray indices ──────────────────────────
def max_subarray_with_indices(nums):
    cur = best = nums[0]
    start = end = 0
    temp_start = 0

    for i in range(1, len(nums)):
        if cur + nums[i] < nums[i]:
            cur = nums[i]
            temp_start = i               # fresh start
        else:
            cur += nums[i]

        if cur > best:
            best = cur
            start = temp_start
            end = i

    return best, start, end


# ── Circular array variant ────────────────────────
def max_subarray_circular(nums: list[int]) -> int:
    total = sum(nums)

    # Case 1: normal Kadane (non-wrapping subarray)
    max_sum = cur_max = nums[0]
    # Case 2: wrap-around = total - min subarray
    min_sum = cur_min = nums[0]

    for num in nums[1:]:
        cur_max = max(num, cur_max + num)
        max_sum = max(max_sum, cur_max)
        cur_min = min(num, cur_min + num)
        min_sum = min(min_sum, cur_min)

    # if all negatives, min_sum == total (entire array), avoid empty subarray
    return max(max_sum, total - min_sum) if max_sum > 0 else max_sum`,
    },
    annotations: [
      { line: 'cur = max(num, cur + num)', note: 'The Kadane decision: extend existing subarray vs. start fresh from current element.' },
      { line: 'best = max(best, cur)', note: 'Track the global best seen so far across all ending positions.' },
      { line: 'total - min_sum', note: 'Circular max = total array sum minus the minimum interior subarray (the "hole").' },
    ],
    patterns: [
      { name: 'Standard Kadane', description: 'Max sum subarray. O(n) time, O(1) space.' },
      { name: 'Max product variant', description: 'Track both max and min (negatives flip). Used in Max Product Subarray (LC 152).' },
      { name: 'Circular Kadane', description: 'Max of (normal Kadane, total - min subarray). Handles wrap-around.' },
    ],
    edgeCases: [
      'All negative numbers — answer is the maximum (least negative) single element',
      'Single element — return that element',
      'All positive numbers — entire array',
      'Array with zeros — zeros act as neutral elements',
    ],
    leetcodeProblems: [
      { id: 53, title: 'Maximum Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/' },
      { id: 918, title: 'Maximum Sum Circular Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-sum-circular-subarray/' },
      { id: 152, title: 'Maximum Product Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-product-subarray/' },
      { id: 121, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
    ],
    interviewTips: [
      'Always handle the all-negative case by initializing with nums[0], not 0.',
      'When asked for the actual subarray (not just sum), track indices with temp_start.',
      'The product variant is trickier — track both max and min because negatives flip sign.',
    ],
  },

  /* ──────────────────────────────────────────────
     LINKED LISTS
  ────────────────────────────────────────────── */

  'reverse-ll': {
    intuition: `Reversing a linked list means flipping all the next pointers to point backward. The iterative approach uses three pointers: prev, curr, next. The key insight: before you move curr.next, you must save the next node — otherwise you lose access to the rest of the list.`,
    whenToUse: [
      'Reverse an entire linked list',
      'Reverse a subrange [m, n]',
      'Check if linked list is palindrome',
      'Reorder list (LC 143)',
    ],
    approach: [
      { step: 1, text: 'Initialize prev = None, curr = head.' },
      { step: 2, text: 'Save next_node = curr.next.' },
      { step: 3, text: 'Flip the pointer: curr.next = prev.' },
      { step: 4, text: 'Advance: prev = curr, curr = next_node.' },
      { step: 5, text: 'When curr is None, prev is the new head.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1) iterative, O(n) recursive',
    complexityNote: 'Each node visited exactly once.',
    code: {
      language: 'python',
      code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# ── Iterative reversal ────────────────────────────
def reverse_list(head: ListNode) -> ListNode:
    prev = None
    curr = head

    while curr:
        next_node = curr.next            # save next before overwriting
        curr.next = prev                 # flip pointer
        prev = curr                      # advance prev
        curr = next_node                 # advance curr

    return prev                          # prev is new head


# ── Recursive reversal ────────────────────────────
def reverse_list_recursive(head: ListNode) -> ListNode:
    if not head or not head.next:
        return head

    new_head = reverse_list_recursive(head.next)
    head.next.next = head               # reverse the link
    head.next = None                    # cut forward link
    return new_head


# ── Reverse sublist [left, right] ─────────────────
def reverse_between(head: ListNode, left: int, right: int) -> ListNode:
    dummy = ListNode(0, head)
    pre = dummy

    for _ in range(left - 1):          # advance pre to node before left
        pre = pre.next

    curr = pre.next
    for _ in range(right - left):
        next_node = curr.next
        curr.next = next_node.next
        next_node.next = pre.next
        pre.next = next_node

    return dummy.next`,
    },
    annotations: [
      { line: 'next_node = curr.next', note: 'Critical: save next pointer BEFORE overwriting curr.next, or the rest of the list is lost.' },
      { line: 'curr.next = prev', note: 'The actual reversal — point this node backward.' },
      { line: 'return prev', note: 'When curr is None, prev is sitting on the last original node = new head.' },
      { line: 'dummy = ListNode(0, head)', note: 'Dummy node simplifies edge cases when left = 1 (reversing from the head).' },
    ],
    patterns: [
      { name: 'Iterative three-pointer', description: 'prev, curr, next_node. O(1) space. Preferred in interviews.' },
      { name: 'Recursive', description: 'Elegant but O(n) stack space. Risk of stack overflow on large lists.' },
      { name: 'Dummy head', description: 'Simplifies sublist reversal by avoiding null checks at the boundary.' },
    ],
    edgeCases: [
      'Empty list → return None',
      'Single node → return head unchanged',
      'left == right in reverse_between → no change needed',
      'left == 1 → the dummy node handles this cleanly',
    ],
    leetcodeProblems: [
      { id: 206, title: 'Reverse Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-linked-list/' },
      { id: 92, title: 'Reverse Linked List II', difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-linked-list-ii/' },
      { id: 234, title: 'Palindrome Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/palindrome-linked-list/' },
      { id: 143, title: 'Reorder List', difficulty: 'Medium', url: 'https://leetcode.com/problems/reorder-list/' },
    ],
    interviewTips: [
      'Draw the pointer state before and after each step on a whiteboard.',
      'Always save next_node first — this is the most common bug.',
      'For palindrome check: find middle (slow/fast), reverse second half, compare.',
    ],
  },

  'floyd-cycle': {
    intuition: `Floyd's Cycle Detection (Tortoise and Hare) uses two pointers: slow moves one step, fast moves two steps. If there's a cycle, fast will lap slow and they'll meet inside the cycle. After meeting, reset one pointer to head and advance both one step at a time — they'll meet at the cycle entry.

Mathematical proof: When they meet, the distance from head to cycle start equals the distance from meeting point to cycle start.`,
    whenToUse: [
      'Detect if a linked list has a cycle',
      'Find the entry point of the cycle',
      'Find duplicate in array (Floyd on index-value graph)',
      'Find the "middle" of a linked list (slow/fast, no cycle)',
    ],
    approach: [
      { step: 1, text: 'Phase 1 — detect: Move slow by 1, fast by 2. If they meet → cycle exists.' },
      { step: 2, text: 'Phase 2 — find entry: Reset slow to head. Move both by 1 until they meet.' },
      { step: 3, text: 'The meeting point in Phase 2 is the cycle entry node.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'O(1) space vs O(n) hash set approach. Fast wins in space-constrained interviews.',
    code: {
      language: 'python',
      code: `# ── Phase 1: detect cycle ─────────────────────────
def has_cycle(head: ListNode) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:                  # pointers met → cycle
            return True
    return False


# ── Phase 2: find cycle entry ─────────────────────
def detect_cycle(head: ListNode) -> ListNode:
    slow = fast = head

    while fast and fast.next:            # Phase 1
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            break
    else:
        return None                       # no cycle

    slow = head                           # Phase 2: reset one pointer
    while slow is not fast:
        slow = slow.next
        fast = fast.next

    return slow                           # cycle entry node


# ── Find middle of linked list ────────────────────
def find_middle(head: ListNode) -> ListNode:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow                           # slow is at middle`,
    },
    annotations: [
      { line: 'while fast and fast.next', note: 'fast.next check prevents NullPointerError when fast is at the last node.' },
      { line: 'if slow is fast', note: 'Use "is" (identity) not "==" (value equality) for node comparison.' },
      { line: 'slow = head', note: 'Key insight: resetting to head and advancing both by 1 finds cycle entry due to the mathematical property of Floyd\'s algorithm.' },
    ],
    patterns: [
      { name: 'Cycle detection', description: 'Slow/fast meet → cycle exists.' },
      { name: 'Cycle entry finding', description: 'After meeting, reset slow to head and advance both by 1.' },
      { name: 'Middle finding', description: 'When fast reaches end, slow is at middle. Used in palindrome check, merge sort on linked lists.' },
    ],
    edgeCases: [
      'Empty list or single node → no cycle',
      'Cycle at the very first node (head.next = head)',
      'Cycle at the last node (tail.next = head)',
      'Two node list with cycle',
    ],
    leetcodeProblems: [
      { id: 141, title: 'Linked List Cycle', difficulty: 'Easy', url: 'https://leetcode.com/problems/linked-list-cycle/' },
      { id: 142, title: 'Linked List Cycle II', difficulty: 'Medium', url: 'https://leetcode.com/problems/linked-list-cycle-ii/' },
      { id: 287, title: 'Find the Duplicate Number', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-the-duplicate-number/' },
      { id: 876, title: 'Middle of the Linked List', difficulty: 'Easy', url: 'https://leetcode.com/problems/middle-of-the-linked-list/' },
    ],
    interviewTips: [
      'Use "is" not "==" when comparing node identity in Python.',
      'Explain the math briefly: "By Floyd\'s theorem, the head-to-entry distance equals the meeting-point-to-entry distance."',
      'LC 287 (Find Duplicate) is a sneaky Floyd application on an array treated as a linked list.',
    ],
  },

  'merge-sorted-ll': {
    intuition: `Merging two sorted linked lists is the core step of merge sort. Compare the heads of both lists, attach the smaller node, and advance that pointer. Use a dummy head to avoid special-casing the first node.`,
    whenToUse: [
      'Merge K sorted lists (use priority queue + this)',
      'Sort linked list (merge sort)',
      'Merge sorted arrays (array version same idea)',
    ],
    approach: [
      { step: 1, text: 'Create a dummy node. Set curr = dummy.' },
      { step: 2, text: 'While both lists are non-empty: attach the smaller head, advance that list\'s pointer, advance curr.' },
      { step: 3, text: 'Attach the remaining non-empty list.' },
      { step: 4, text: 'Return dummy.next.' },
    ],
    timeComplexity: 'O(m + n)',
    spaceComplexity: 'O(1) iterative',
    complexityNote: 'Each node from both lists is visited exactly once.',
    code: {
      language: 'python',
      code: `def merge_two_lists(l1: ListNode, l2: ListNode) -> ListNode:
    dummy = ListNode(0)
    curr = dummy

    while l1 and l2:
        if l1.val <= l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next

    curr.next = l1 or l2                  # attach remaining list
    return dummy.next


# ── Merge K sorted lists ──────────────────────────
import heapq

def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))

    dummy = curr = ListNode(0)
    while heap:
        val, i, node = heapq.heappop(heap)
        curr.next = node
        curr = curr.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))

    return dummy.next`,
    },
    annotations: [
      { line: 'dummy = ListNode(0)', note: 'Dummy simplifies attaching the very first node without a special case.' },
      { line: 'curr.next = l1 or l2', note: 'One list is exhausted. Directly attach the rest — no need to iterate.' },
      { line: 'heapq.heappush(heap, (node.val, i, node))', note: 'Include index i as tiebreaker since ListNode isn\'t comparable in Python.' },
    ],
    patterns: [
      { name: 'Dummy head + two pointers', description: 'Standard merge of two sorted lists.' },
      { name: 'Min-heap merge', description: 'Merge K lists efficiently in O(N log K) where N = total nodes.' },
      { name: 'Divide and conquer', description: 'Alternative for K lists: repeatedly merge pairs, halving the problem.' },
    ],
    edgeCases: [
      'Either list is empty → return the other',
      'Both lists empty → return None',
      'Equal values → either order is valid',
      'Lists of very different lengths',
    ],
    leetcodeProblems: [
      { id: 21, title: 'Merge Two Sorted Lists', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
      { id: 23, title: 'Merge k Sorted Lists', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
      { id: 148, title: 'Sort List', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-list/' },
    ],
    interviewTips: [
      'Always use a dummy head — it eliminates annoying null checks.',
      'For K lists, a min-heap is O(N log K); naive pair merging is O(NK).',
      '"Sort List" (LC 148) combines find-middle + merge — the canonical linked list merge sort.',
    ],
  },

  'll-nth-end': {
    intuition: `To remove the Nth node from the end without knowing the list length, use two pointers separated by N steps. When the fast pointer reaches the end, the slow pointer is exactly at the node before the target. Use a dummy head to handle removing the actual head node.`,
    whenToUse: [
      'Remove Nth from end in one pass',
      'Find Kth from end',
      'Any "relative position from end" problem',
    ],
    approach: [
      { step: 1, text: 'Create dummy → dummy.next = head.' },
      { step: 2, text: 'Advance fast pointer N+1 steps from dummy.' },
      { step: 3, text: 'Move both fast and slow together until fast is None.' },
      { step: 4, text: 'slow.next = slow.next.next (skip the target node).' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'One pass through the list.',
    code: {
      language: 'python',
      code: `def remove_nth_from_end(head: ListNode, n: int) -> ListNode:
    dummy = ListNode(0, head)
    fast = slow = dummy

    for _ in range(n + 1):               # advance fast by n+1 steps
        fast = fast.next

    while fast:                           # move together
        fast = fast.next
        slow = slow.next

    slow.next = slow.next.next            # remove target node
    return dummy.next`,
    },
    annotations: [
      { line: 'for _ in range(n + 1)', note: 'n+1 (not n) because we start from dummy, giving slow a buffer to stop BEFORE the target.' },
      { line: 'slow.next = slow.next.next', note: 'Skip the node to be removed by pointing past it.' },
    ],
    patterns: [
      { name: 'Gap of N pointers', description: 'Fast pointer N+1 ahead of slow. When fast is None, slow is just before the target.' },
    ],
    edgeCases: [
      'Remove the head (n == length) → dummy handles this',
      'Single element list → return None',
      'n == 1 → remove last node',
    ],
    leetcodeProblems: [
      { id: 19, title: 'Remove Nth Node From End of List', difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },
      { id: 61, title: 'Rotate List', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-list/' },
    ],
    interviewTips: [
      'n+1 offset (not n) is the most common off-by-one mistake here.',
      'Dummy node is essential — without it you need a separate check for removing the head.',
    ],
  },

  /* ──────────────────────────────────────────────
     TREES
  ────────────────────────────────────────────── */

  'tree-traversals': {
    intuition: `Tree traversal visits every node systematically. DFS (Depth-First Search) goes deep before backtracking — three variants: inorder (L-Root-R, gives sorted order for BST), preorder (Root-L-R, useful for cloning), postorder (L-R-Root, useful for deletion). BFS (Breadth-First Search) visits level by level using a queue.`,
    whenToUse: [
      'DFS Inorder: BST sorted output, validate BST',
      'DFS Preorder: serialize/clone a tree',
      'DFS Postorder: delete tree, compute subtree sizes',
      'BFS: level-order output, shortest path in unweighted tree, right-side view',
    ],
    approach: [
      { step: 1, text: 'DFS Recursive: base case = None, then recurse on children in the appropriate order.' },
      { step: 2, text: 'DFS Iterative: use an explicit stack to mimic the call stack.' },
      { step: 3, text: 'BFS: use a deque. Pop front, process, append left and right children.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h) DFS where h = height; O(n) BFS worst case',
    complexityNote: 'Balanced tree: h = O(log n). Skewed tree: h = O(n).',
    code: {
      language: 'python',
      code: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

# ── DFS Inorder (recursive) ───────────────────────
def inorder(root: TreeNode) -> list[int]:
    result = []
    def dfs(node):
        if not node: return
        dfs(node.left)
        result.append(node.val)          # process BETWEEN subtrees
        dfs(node.right)
    dfs(root)
    return result

# ── DFS Preorder (iterative) ──────────────────────
def preorder_iterative(root: TreeNode) -> list[int]:
    if not root: return []
    stack, result = [root], []
    while stack:
        node = stack.pop()
        result.append(node.val)          # process FIRST
        if node.right: stack.append(node.right)
        if node.left:  stack.append(node.left)  # left last = processed first
    return result

# ── BFS Level-order ───────────────────────────────
def level_order(root: TreeNode) -> list[list[int]]:
    if not root: return []
    queue = deque([root])
    result = []
    while queue:
        level = []
        for _ in range(len(queue)):      # process entire level
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result`,
    },
    annotations: [
      { line: 'result.append(node.val)  # process BETWEEN subtrees', note: 'Inorder: Left → Node → Right. For a BST this produces sorted output.' },
      { line: 'if node.right: stack.append(node.right)', note: 'Push right before left so left is on top of stack and processed first.' },
      { line: 'for _ in range(len(queue))', note: 'Snapshot queue size at start of each level to avoid mixing levels.' },
    ],
    patterns: [
      { name: 'Inorder DFS', description: 'BST → sorted order. Validate BST by checking sorted property.' },
      { name: 'Preorder DFS', description: 'Root first. Good for tree serialization and cloning.' },
      { name: 'Postorder DFS', description: 'Children first. Good for bottom-up computations (height, diameter).' },
      { name: 'BFS level-order', description: 'Level by level. Right-side view, zigzag, min depth.' },
    ],
    edgeCases: [
      'Empty tree → return []',
      'Single node → return [val]',
      'Skewed tree (like a linked list) → DFS is O(n) space',
      'Complete binary tree → balanced, best performance',
    ],
    leetcodeProblems: [
      { id: 94, title: 'Binary Tree Inorder Traversal', difficulty: 'Easy', url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/' },
      { id: 102, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
      { id: 199, title: 'Binary Tree Right Side View', difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-right-side-view/' },
      { id: 297, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/' },
    ],
    interviewTips: [
      'Always handle the empty tree base case first.',
      'BFS with level separation (for _ in range(len(queue))) is a must-know pattern.',
      'Iterative inorder is trickier — use a stack and a curr pointer.',
    ],
  },

  'bst-ops': {
    intuition: `A Binary Search Tree (BST) has the invariant: all values in the left subtree < node < all values in the right subtree. This enables O(h) search, insert, delete — O(log n) for balanced trees. Understanding BST operations is foundational for balanced BSTs (AVL, Red-Black) and databases.`,
    whenToUse: [
      'Ordered dictionary / set operations',
      'Range queries on values',
      'Kth smallest / largest element',
      'Validate BST property',
      'Floor / ceiling queries',
    ],
    approach: [
      { step: 1, text: 'Search: if val < node.val go left, else go right. Return when found or null.' },
      { step: 2, text: 'Insert: same path as search; insert as a new leaf.' },
      { step: 3, text: 'Delete: 3 cases — leaf (just remove), one child (link parent to child), two children (replace with inorder successor, delete successor).' },
    ],
    timeComplexity: 'O(h) — h is tree height',
    spaceComplexity: 'O(h) recursive stack',
    complexityNote: 'Balanced BST: O(log n). Worst case (sorted input): O(n) — degenerates to linked list.',
    code: {
      language: 'python',
      code: `# ── BST Search ───────────────────────────────────
def search_bst(root: TreeNode, val: int) -> TreeNode:
    if not root or root.val == val:
        return root
    if val < root.val:
        return search_bst(root.left, val)
    return search_bst(root.right, val)


# ── BST Insert ───────────────────────────────────
def insert_bst(root: TreeNode, val: int) -> TreeNode:
    if not root:
        return TreeNode(val)             # create new leaf
    if val < root.val:
        root.left = insert_bst(root.left, val)
    else:
        root.right = insert_bst(root.right, val)
    return root


# ── BST Delete ───────────────────────────────────
def delete_node(root: TreeNode, key: int) -> TreeNode:
    if not root:
        return None
    if key < root.val:
        root.left = delete_node(root.left, key)
    elif key > root.val:
        root.right = delete_node(root.right, key)
    else:
        if not root.left: return root.right   # case 1 & 2
        if not root.right: return root.left
        # case 3: two children — find inorder successor
        successor = root.right
        while successor.left:
            successor = successor.left
        root.val = successor.val               # overwrite with successor
        root.right = delete_node(root.right, successor.val)
    return root


# ── Validate BST ─────────────────────────────────
def is_valid_bst(root: TreeNode, lo=float('-inf'), hi=float('inf')) -> bool:
    if not root: return True
    if not (lo < root.val < hi): return False
    return (is_valid_bst(root.left, lo, root.val) and
            is_valid_bst(root.right, root.val, hi))`,
    },
    annotations: [
      { line: 'if not root: return TreeNode(val)', note: 'Recursion bottoms out at the correct leaf position.' },
      { line: 'successor = root.right; while successor.left', note: 'Inorder successor: go right once, then left as far as possible.' },
      { line: 'is_valid_bst(root.left, lo, root.val)', note: 'Pass bounds down: left subtree must be in (lo, root.val).' },
    ],
    patterns: [
      { name: 'Recursive traversal with bounds', description: 'Validate BST, find range of values.' },
      { name: 'Inorder successor/predecessor', description: 'Used in delete, floor/ceiling queries.' },
      { name: 'Iterative BST traversal', description: 'O(1) space Morris traversal for special cases.' },
    ],
    edgeCases: [
      'Duplicate values — depends on problem (usually not allowed in BST)',
      'Delete from single-node tree → return None',
      'Validate: INT_MIN/INT_MAX as root values — use float boundaries',
      'Highly unbalanced tree — operations degrade to O(n)',
    ],
    leetcodeProblems: [
      { id: 98, title: 'Validate Binary Search Tree', difficulty: 'Medium', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
      { id: 700, title: 'Search in a Binary Search Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/search-in-a-binary-search-tree/' },
      { id: 701, title: 'Insert into a Binary Search Tree', difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-into-a-binary-search-tree/' },
      { id: 450, title: 'Delete Node in a BST', difficulty: 'Medium', url: 'https://leetcode.com/problems/delete-node-in-a-bst/' },
      { id: 230, title: 'Kth Smallest Element in a BST', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/' },
    ],
    interviewTips: [
      'Validate BST: don\'t just compare with parent — pass down min/max bounds.',
      'Delete is the hardest operation; practice the three cases separately.',
      'Inorder of BST = sorted array. Many BST problems reduce to inorder traversal.',
    ],
  },

  'lca': {
    intuition: `Lowest Common Ancestor (LCA) of two nodes p, q is the deepest node that has both p and q as descendants. For a general binary tree: if either p or q matches the current node, return it. Otherwise recurse both sides — if both sides return non-null, current node is the LCA. For BST: use BST property to navigate directly.`,
    whenToUse: [
      'Find LCA in binary tree / BST',
      'Path between two nodes (LCA is the turning point)',
      'Distance between nodes = dist(root, p) + dist(root, q) - 2*dist(root, LCA)',
    ],
    approach: [
      { step: 1, text: 'Base case: if root is None, or root == p or root == q, return root.' },
      { step: 2, text: 'Recurse left and right.' },
      { step: 3, text: 'If both sides return non-null → current node is LCA.' },
      { step: 4, text: 'If only one side is non-null → return that side (p and q are both in that subtree).' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    complexityNote: 'Visits every node once in the worst case.',
    code: {
      language: 'python',
      code: `# ── LCA of Binary Tree ───────────────────────────
def lowest_common_ancestor(root, p, q):
    if not root or root == p or root == q:
        return root                       # found one of the targets

    left  = lowest_common_ancestor(root.left, p, q)
    right = lowest_common_ancestor(root.right, p, q)

    if left and right:
        return root                       # p on one side, q on the other
    return left or right                  # both on same side


# ── LCA of BST (O(log n) for balanced) ───────────
def lca_bst(root, p, q):
    while root:
        if p.val < root.val and q.val < root.val:
            root = root.left              # both left
        elif p.val > root.val and q.val > root.val:
            root = root.right             # both right
        else:
            return root                   # split point = LCA`,
    },
    annotations: [
      { line: 'if not root or root == p or root == q', note: 'If we hit null or find either target, bubble it up.' },
      { line: 'if left and right: return root', note: 'Both targets found on different sides — current node is the LCA.' },
      { line: 'return left or right', note: 'Both targets are in the same subtree; return the non-null result.' },
    ],
    patterns: [],
    edgeCases: [
      'p or q is an ancestor of the other — algorithm handles this correctly (returns the ancestor)',
      'p == q — LCA is p itself',
      'p or q not in tree — problem usually guarantees both exist',
    ],
    leetcodeProblems: [
      { id: 236, title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/' },
      { id: 235, title: 'Lowest Common Ancestor of a BST', difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/' },
      { id: 1650, title: 'Lowest Common Ancestor III', difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree-iii/' },
    ],
    interviewTips: [
      'The post-order nature of this recursion is key — process children before making the decision.',
      'For BST LCA, exploit the ordering for O(log n) instead of O(n).',
      'Trace through: if both left and right are non-null, the current node is definitely the split point.',
    ],
  },

  'max-depth': {
    intuition: `Max depth (height) of a tree is 1 + max(depth of left subtree, depth of right subtree). It's the foundational recursive tree problem — the template that appears in many harder problems (diameter, balanced check, path sum).`,
    whenToUse: [
      'Tree height / depth',
      'Check if balanced (|left depth - right depth| <= 1 at every node)',
      'Diameter of binary tree (longest path through any node)',
      'Any bottom-up computation on a tree',
    ],
    approach: [
      { step: 1, text: 'Base case: if node is null, return 0.' },
      { step: 2, text: 'Recurse: left_depth = max_depth(root.left), right_depth = max_depth(root.right).' },
      { step: 3, text: 'Return 1 + max(left_depth, right_depth).' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    complexityNote: 'Visits every node once.',
    code: {
      language: 'python',
      code: `# ── Max depth ─────────────────────────────────────
def max_depth(root: TreeNode) -> int:
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))


# ── Check if balanced ─────────────────────────────
def is_balanced(root: TreeNode) -> bool:
    def height(node):
        if not node: return 0
        lh = height(node.left)
        if lh == -1: return -1           # short-circuit
        rh = height(node.right)
        if rh == -1: return -1
        if abs(lh - rh) > 1: return -1  # unbalanced
        return 1 + max(lh, rh)
    return height(root) != -1


# ── Diameter of binary tree ───────────────────────
def diameter_of_binary_tree(root: TreeNode) -> int:
    self_diameter = [0]
    def depth(node):
        if not node: return 0
        l, r = depth(node.left), depth(node.right)
        self_diameter[0] = max(self_diameter[0], l + r)
        return 1 + max(l, r)
    depth(root)
    return self_diameter[0]`,
    },
    annotations: [
      { line: 'if lh == -1: return -1', note: 'Early exit: once we know a subtree is unbalanced, stop computing.' },
      { line: 'self_diameter[0] = max(self_diameter[0], l + r)', note: 'Diameter at this node = left depth + right depth. Update global max.' },
    ],
    patterns: [
      { name: 'Bottom-up recursion', description: 'Return values bubble up from leaves. Used in height, diameter, path sum.' },
      { name: 'Return -1 as sentinel', description: 'Encode "invalid / unbalanced" as -1 to short-circuit without extra variables.' },
    ],
    edgeCases: [
      'Empty tree → height 0',
      'Single node → height 1',
      'Skewed tree → height == n',
    ],
    leetcodeProblems: [
      { id: 104, title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' },
      { id: 110, title: 'Balanced Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/balanced-binary-tree/' },
      { id: 543, title: 'Diameter of Binary Tree', difficulty: 'Easy', url: 'https://leetcode.com/problems/diameter-of-binary-tree/' },
      { id: 124, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },
    ],
    interviewTips: [
      'Max depth is the "hello world" of tree recursion. Master it, then extend to harder problems.',
      'Diameter: the path doesn\'t have to go through the root. Use a nonlocal/array for the global max.',
      'For balanced: use -1 as sentinel instead of throwing an exception.',
    ],
  },

  /* ──────────────────────────────────────────────
     GRAPHS
  ────────────────────────────────────────────── */

  'graph-bfs-dfs': {
    intuition: `Graph BFS and DFS are generalizations of tree traversals with one key difference: graphs can have cycles, so you must track visited nodes. BFS (queue) explores neighbors level by level — perfect for shortest paths in unweighted graphs. DFS (stack/recursion) goes deep — perfect for connectivity, cycle detection, and topological sort.`,
    whenToUse: [
      'BFS: shortest path in unweighted graph, min steps, bipartite check',
      'DFS: cycle detection, connected components, topological sort, islands',
      'Both: reachability, path existence',
    ],
    approach: [
      { step: 1, text: 'Build adjacency list from edge list if not given.' },
      { step: 2, text: 'Initialize visited set, queue (BFS) or stack/recursion (DFS).' },
      { step: 3, text: 'Process each node: mark visited, enqueue/recurse neighbors not yet visited.' },
      { step: 4, text: 'For disconnected graphs: iterate over all nodes and start BFS/DFS from unvisited ones.' },
    ],
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    complexityNote: 'V = vertices, E = edges. Each vertex and edge processed once.',
    code: {
      language: 'python',
      code: `from collections import deque, defaultdict

# ── Build adjacency list ──────────────────────────
def build_graph(n: int, edges: list) -> dict:
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)               # undirected
    return graph


# ── BFS ───────────────────────────────────────────
def bfs(graph: dict, start: int) -> list[int]:
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order


# ── DFS (recursive) ───────────────────────────────
def dfs(graph: dict, node: int, visited: set) -> list[int]:
    visited.add(node)
    order = [node]
    for neighbor in graph[node]:
        if neighbor not in visited:
            order.extend(dfs(graph, neighbor, visited))
    return order


# ── Count connected components ────────────────────
def count_components(n: int, edges: list) -> int:
    graph = build_graph(n, edges)
    visited = set()
    count = 0

    for node in range(n):
        if node not in visited:
            bfs(graph, node)             # or dfs
            visited.update(...)          # update visited from traversal
            count += 1

    return count


# ── Shortest path (BFS) ───────────────────────────
def shortest_path(graph: dict, start: int, end: int) -> int:
    if start == end: return 0
    visited = {start}
    queue = deque([(start, 0)])

    while queue:
        node, dist = queue.popleft()
        for neighbor in graph[node]:
            if neighbor == end: return dist + 1
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))

    return -1  # no path`,
    },
    annotations: [
      { line: 'visited = {start}', note: 'Add to visited BEFORE enqueuing, not when popping. Avoids duplicate processing.' },
      { line: 'queue.popleft()', note: 'BFS uses a queue (FIFO). DFS would use a stack (LIFO) or recursion.' },
      { line: 'if neighbor == end: return dist + 1', note: 'Early exit in BFS guarantees the first time we reach end = shortest path.' },
    ],
    patterns: [
      { name: 'BFS shortest path', description: 'Only BFS guarantees shortest path in unweighted graphs.' },
      { name: 'Multi-source BFS', description: 'Start BFS from multiple nodes simultaneously. Used in rotting oranges, walls and gates.' },
      { name: 'DFS cycle detection', description: 'Track recursion stack (in addition to visited) for directed graphs.' },
    ],
    edgeCases: [
      'Disconnected graph — must iterate over all nodes',
      'Graph with self-loops',
      'Empty graph (no edges)',
      'start == end',
    ],
    leetcodeProblems: [
      { id: 200, title: 'Number of Islands', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-islands/' },
      { id: 133, title: 'Clone Graph', difficulty: 'Medium', url: 'https://leetcode.com/problems/clone-graph/' },
      { id: 542, title: '01 Matrix', difficulty: 'Medium', url: 'https://leetcode.com/problems/01-matrix/' },
      { id: 994, title: 'Rotting Oranges', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotting-oranges/' },
      { id: 207, title: 'Course Schedule', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/' },
    ],
    interviewTips: [
      'Mark visited BEFORE adding to queue, not when popping — prevents O(n²) duplicates.',
      'Multi-source BFS: add all sources to queue at the start with distance 0.',
      'For grids, (row, col) tuples serve as graph nodes — no need to build explicit adjacency list.',
    ],
  },

  'topo-sort': {
    intuition: `Topological Sort orders nodes of a DAG (Directed Acyclic Graph) such that every directed edge u→v has u before v. Two algorithms: Kahn's (BFS-based, uses in-degree counts) and DFS-based (post-order reversal). If a cycle exists, topological sort is impossible — this doubles as cycle detection.`,
    whenToUse: [
      'Task scheduling with dependencies',
      'Build order / compilation order',
      'Course prerequisites',
      'Detect cycle in directed graph',
    ],
    approach: [
      { step: 1, text: 'Kahn\'s: compute in-degrees. Enqueue all nodes with in-degree 0.' },
      { step: 2, text: 'Pop a node, add to result, decrement neighbors\' in-degrees. If any neighbor reaches 0, enqueue it.' },
      { step: 3, text: 'If result length < n, there\'s a cycle.' },
    ],
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V + E)',
    complexityNote: 'Each node and edge processed once.',
    code: {
      language: 'python',
      code: `from collections import deque, defaultdict

# ── Kahn's Algorithm (BFS-based) ──────────────────
def topo_sort_kahn(n: int, prerequisites: list) -> list[int]:
    graph = defaultdict(list)
    in_degree = [0] * n

    for a, b in prerequisites:
        graph[b].append(a)               # b → a (b must come before a)
        in_degree[a] += 1

    queue = deque(i for i in range(n) if in_degree[i] == 0)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == n else []  # empty = cycle detected


# ── DFS-based topological sort ────────────────────
def topo_sort_dfs(n: int, edges: list) -> list[int]:
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)

    WHITE, GRAY, BLACK = 0, 1, 2        # unvisited, in-progress, done
    color = [WHITE] * n
    result = []
    has_cycle = [False]

    def dfs(u):
        if has_cycle[0]: return
        color[u] = GRAY                  # mark in-progress
        for v in graph[u]:
            if color[v] == GRAY:
                has_cycle[0] = True; return  # back edge = cycle
            if color[v] == WHITE:
                dfs(v)
        color[u] = BLACK
        result.append(u)                 # add AFTER all descendants

    for i in range(n):
        if color[i] == WHITE:
            dfs(i)

    return [] if has_cycle[0] else result[::-1]`,
    },
    annotations: [
      { line: 'queue = deque(i for i in range(n) if in_degree[i] == 0)', note: 'Start with all nodes that have no prerequisites.' },
      { line: 'return order if len(order) == n else []', note: 'If we didn\'t process all n nodes, a cycle prevented full traversal.' },
      { line: 'color[u] = GRAY', note: 'Gray = currently in DFS stack. If we visit a gray node again, it\'s a cycle.' },
      { line: 'result.append(u)  # add AFTER all descendants', note: 'Post-order: node added after all its dependents are done. Reverse at end.' },
    ],
    patterns: [
      { name: 'Kahn\'s (BFS)', description: 'Intuitive, also detects cycles, processes level by level. Preferred in interviews.' },
      { name: 'DFS post-order', description: 'Natural with recursion. Reverse post-order = topological order.' },
    ],
    edgeCases: [
      'No edges → any order is valid',
      'Cycle → return empty / impossible',
      'Disconnected DAG → handle all start nodes (in-degree 0 handles this)',
      'Single node → return [node]',
    ],
    leetcodeProblems: [
      { id: 207, title: 'Course Schedule', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule/' },
      { id: 210, title: 'Course Schedule II', difficulty: 'Medium', url: 'https://leetcode.com/problems/course-schedule-ii/' },
      { id: 269, title: 'Alien Dictionary', difficulty: 'Hard', url: 'https://leetcode.com/problems/alien-dictionary/' },
    ],
    interviewTips: [
      'Kahn\'s is easier to implement correctly under pressure — prefer it in interviews.',
      'Cycle detection: result length < n (Kahn\'s) or gray-node revisit (DFS).',
      'Alien Dictionary: derive edge ordering from adjacent words, then topo sort.',
    ],
  },

  'dijkstra': {
    intuition: `Dijkstra's Algorithm finds the shortest path from a source to all vertices in a weighted graph with non-negative edge weights. It's a greedy BFS variant using a min-heap: always expand the closest unvisited node.

The key insight: once a node is popped from the min-heap with the smallest distance, that distance is finalized (because all remaining nodes are farther away).`,
    whenToUse: [
      'Single-source shortest paths with non-negative weights',
      'Network routing, GPS navigation',
      'Cheapest flights, minimum cost path',
    ],
    approach: [
      { step: 1, text: 'Initialize dist = {source: 0, all others: ∞}. Push (0, source) to min-heap.' },
      { step: 2, text: 'Pop (cost, node) from heap.' },
      { step: 3, text: 'If cost > dist[node], skip (stale entry).' },
      { step: 4, text: 'For each neighbor: if dist[node] + weight < dist[neighbor], update dist[neighbor] and push to heap.' },
    ],
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V + E)',
    complexityNote: 'Heap operations dominate. For dense graphs, consider Bellman-Ford or adjacency matrix.',
    code: {
      language: 'python',
      code: `import heapq
from collections import defaultdict

def dijkstra(n: int, edges: list, src: int) -> dict:
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
        graph[v].append((u, w))          # undirected

    dist = {i: float('inf') for i in range(n)}
    dist[src] = 0
    heap = [(0, src)]                    # (cost, node)

    while heap:
        cost, node = heapq.heappop(heap)

        if cost > dist[node]:            # stale entry — skip
            continue

        for neighbor, weight in graph[node]:
            new_cost = cost + weight
            if new_cost < dist[neighbor]:
                dist[neighbor] = new_cost
                heapq.heappush(heap, (new_cost, neighbor))

    return dist  # dist[v] = shortest distance from src to v`,
    },
    annotations: [
      { line: 'if cost > dist[node]: continue', note: 'Lazy deletion: skip stale heap entries. A node can be in the heap multiple times.' },
      { line: 'if new_cost < dist[neighbor]', note: 'Relaxation: only update if we found a shorter path.' },
    ],
    patterns: [
      { name: 'Standard Dijkstra', description: 'Non-negative weights. Min-heap for O((V+E) log V).' },
      { name: 'Bellman-Ford', description: 'Negative weights allowed. O(VE) time — use when Dijkstra fails.' },
      { name: 'A* Search', description: 'Dijkstra + heuristic. Used in pathfinding with spatial knowledge.' },
    ],
    edgeCases: [
      'Negative edge weights → Dijkstra is INCORRECT, use Bellman-Ford',
      'No path exists → dist[target] remains infinity',
      'Source == destination → cost 0',
      'Disconnected graph → unreachable nodes stay at infinity',
    ],
    leetcodeProblems: [
      { id: 743, title: 'Network Delay Time', difficulty: 'Medium', url: 'https://leetcode.com/problems/network-delay-time/' },
      { id: 787, title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', url: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/' },
      { id: 1514, title: 'Path with Maximum Probability', difficulty: 'Medium', url: 'https://leetcode.com/problems/path-with-maximum-probability/' },
    ],
    interviewTips: [
      'Dijkstra doesn\'t work with negative weights — always confirm this assumption.',
      'The "stale entry" skip (`if cost > dist[node]`) is the most commonly missed optimization.',
      'To recover the actual path (not just distance), store a prev[] array.',
    ],
  },

  'union-find': {
    intuition: `Union-Find (Disjoint Set Union) efficiently answers: "Are these two elements in the same connected component?" It maintains a forest of trees where each tree = one component. Two optimizations: path compression (flatten the tree during find) and union by rank/size (always attach smaller tree under larger). Together: nearly O(1) amortized per operation.`,
    whenToUse: [
      'Dynamic connectivity queries',
      'Kruskal\'s MST algorithm',
      'Detect cycle in undirected graph',
      'Number of provinces / connected components',
      'Accounts merge, redundant connection',
    ],
    approach: [
      { step: 1, text: 'Initialize: parent[i] = i, rank[i] = 0.' },
      { step: 2, text: 'Find(x): recursively find root. Apply path compression: parent[x] = find(parent[x]).' },
      { step: 3, text: 'Union(x, y): find roots. If different, attach smaller rank root under larger. Increment rank if equal.' },
    ],
    timeComplexity: 'O(α(n)) per operation — α is inverse Ackermann (practically O(1))',
    spaceComplexity: 'O(n)',
    complexityNote: 'Path compression + union by rank makes operations nearly constant time.',
    code: {
      language: 'python',
      code: `class UnionFind:
    def __init__(self, n: int):
        self.parent = list(range(n))     # parent[i] = i (self-loop)
        self.rank   = [0] * n
        self.components = n

    def find(self, x: int) -> int:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x: int, y: int) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False                 # already connected (would form cycle)
        if self.rank[rx] < self.rank[ry]:
            rx, ry = ry, rx             # attach smaller under larger
        self.parent[ry] = rx
        if self.rank[rx] == self.rank[ry]:
            self.rank[rx] += 1
        self.components -= 1
        return True

    def connected(self, x: int, y: int) -> bool:
        return self.find(x) == self.find(y)


# ── Detect cycle in undirected graph ──────────────
def has_cycle(n: int, edges: list) -> bool:
    uf = UnionFind(n)
    for u, v in edges:
        if not uf.union(u, v):          # already connected → adding edge = cycle
            return True
    return False`,
    },
    annotations: [
      { line: 'self.parent[x] = self.find(self.parent[x])', note: 'Path compression: flatten the tree so future finds are O(1).' },
      { line: 'if self.rank[rx] < self.rank[ry]: rx, ry = ry, rx', note: 'Union by rank: always attach the shorter tree under the taller one.' },
      { line: 'if not uf.union(u, v): return True', note: 'If union returns False, the two nodes were already connected — adding this edge creates a cycle.' },
    ],
    patterns: [],
    edgeCases: [
      'Self-loop: u == v → always a cycle',
      'No edges → n separate components',
      'Complete graph → 1 component after n-1 unions',
    ],
    leetcodeProblems: [
      { id: 547, title: 'Number of Provinces', difficulty: 'Medium', url: 'https://leetcode.com/problems/number-of-provinces/' },
      { id: 684, title: 'Redundant Connection', difficulty: 'Medium', url: 'https://leetcode.com/problems/redundant-connection/' },
      { id: 1584, title: 'Min Cost to Connect All Points', difficulty: 'Medium', url: 'https://leetcode.com/problems/min-cost-to-connect-all-points/' },
      { id: 990, title: 'Satisfiability of Equality Equations', difficulty: 'Medium', url: 'https://leetcode.com/problems/satisfiability-of-equality-equations/' },
    ],
    interviewTips: [
      'Always implement with both path compression AND union by rank for O(α(n)).',
      'Track component count in the DSU class for "number of components" problems.',
      'Kruskal\'s MST = sort edges by weight + union-find for cycle detection.',
    ],
  },

  /* ──────────────────────────────────────────────
     DYNAMIC PROGRAMMING
  ────────────────────────────────────────────── */

  'dp-1d': {
    intuition: `1D DP problems build a solution from smaller subproblems stored in an array. Fibonacci and Climbing Stairs are the canonical examples — the answer for step n depends only on the previous 1-2 results. The DP table trades space for time by avoiding redundant computation.`,
    whenToUse: [
      'Problems with overlapping subproblems and optimal substructure',
      'Fibonacci sequences',
      'Counting paths / ways',
      'Minimum/maximum cost problems with one variable',
    ],
    approach: [
      { step: 1, text: 'Define dp[i] as the answer for subproblem of size i.' },
      { step: 2, text: 'Identify the recurrence: dp[i] = f(dp[i-1], dp[i-2], ...).' },
      { step: 3, text: 'Set base cases: dp[0], dp[1].' },
      { step: 4, text: 'Fill dp bottom-up from left to right.' },
      { step: 5, text: 'Optimize: if only last k values needed, reduce to O(1) space.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n) table → O(1) with space optimization',
    complexityNote: 'Space can be reduced from O(n) to O(1) when only recent values are needed.',
    code: {
      language: 'python',
      code: `# ── Fibonacci (top-down memoization) ──────────────
from functools import lru_cache

@lru_cache(maxsize=None)
def fib_memo(n: int) -> int:
    if n <= 1: return n
    return fib_memo(n - 1) + fib_memo(n - 2)


# ── Climbing Stairs (bottom-up DP) ────────────────
def climb_stairs(n: int) -> int:
    if n <= 2: return n
    prev2, prev1 = 1, 2                  # dp[1]=1, dp[2]=2
    for i in range(3, n + 1):
        curr = prev1 + prev2             # dp[i] = dp[i-1] + dp[i-2]
        prev2, prev1 = prev1, curr
    return prev1


# ── Min cost climbing stairs ──────────────────────
def min_cost_climbing_stairs(cost: list[int]) -> int:
    n = len(cost)
    dp = [0] * (n + 1)
    for i in range(2, n + 1):
        dp[i] = min(dp[i-1] + cost[i-1],
                    dp[i-2] + cost[i-2])
    return dp[n]


# ── House Robber ──────────────────────────────────
def rob(nums: list[int]) -> int:
    prev2 = prev1 = 0
    for num in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + num)
    return prev1`,
    },
    annotations: [
      { line: '@lru_cache(maxsize=None)', note: 'Python built-in memoization. Converts O(2^n) recursion to O(n) time.' },
      { line: 'prev2, prev1 = prev1, curr', note: 'Rolling variables: O(1) space instead of O(n) array.' },
      { line: 'prev2, prev1 = prev1, max(prev1, prev2 + num)', note: 'Robber choice: skip this house (prev1) OR rob it (prev2 + num).' },
    ],
    patterns: [
      { name: 'Fibonacci recurrence', description: 'dp[i] = dp[i-1] + dp[i-2]. Climbing stairs, tribonacci, etc.' },
      { name: 'Rolling variables', description: 'Replace O(n) array with 2-3 variables when only recent values matter.' },
      { name: 'Decision at each step', description: 'Take or skip current element. House robber, stock prices.' },
    ],
    edgeCases: [
      'n = 0 or n = 1 → handle base cases explicitly',
      'Empty array → return 0',
      'Single element → return that element',
    ],
    leetcodeProblems: [
      { id: 70, title: 'Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' },
      { id: 746, title: 'Min Cost Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/min-cost-climbing-stairs/' },
      { id: 198, title: 'House Robber', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber/' },
      { id: 213, title: 'House Robber II', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber-ii/' },
      { id: 509, title: 'Fibonacci Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/fibonacci-number/' },
    ],
    interviewTips: [
      'Start with the recurrence relation, then think about base cases.',
      'Always check if space can be optimized — it shows strong understanding.',
      'House Robber II = run House Robber twice: on [0..n-2] and [1..n-1].',
    ],
  },

  'dp-knapsack': {
    intuition: `0/1 Knapsack: given items with weights and values, maximize total value without exceeding capacity W. Each item can be taken (1) or left (0). The DP table dp[i][w] = max value using first i items with capacity w. Key transition: take item i (dp[i-1][w-weight[i]] + value[i]) or skip it (dp[i-1][w]).`,
    whenToUse: [
      '0/1 Knapsack and variants',
      'Partition equal subset sum',
      'Target sum with +/-',
      'Coin change (unbounded variant)',
      'Number of ways to reach sum',
    ],
    approach: [
      { step: 1, text: 'Define dp[i][w] = max value using items 0..i with capacity w.' },
      { step: 2, text: 'Transition: dp[i][w] = max(dp[i-1][w], dp[i-1][w - wt[i]] + val[i]) if wt[i] <= w.' },
      { step: 3, text: 'Space optimize: use 1D array, iterate capacity in reverse.' },
    ],
    timeComplexity: 'O(n × W)',
    spaceComplexity: 'O(W) optimized',
    complexityNote: 'Pseudo-polynomial — W can be large, making this not truly polynomial.',
    code: {
      language: 'python',
      code: `# ── 0/1 Knapsack ─────────────────────────────────
def knapsack(weights: list, values: list, W: int) -> int:
    n = len(weights)
    dp = [0] * (W + 1)

    for i in range(n):
        for w in range(W, weights[i] - 1, -1):   # reverse to avoid reuse
            dp[w] = max(dp[w],
                        dp[w - weights[i]] + values[i])

    return dp[W]


# ── Partition Equal Subset Sum ────────────────────
def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2: return False
    target = total // 2

    dp = [False] * (target + 1)
    dp[0] = True                         # empty subset sums to 0

    for num in nums:
        for j in range(target, num - 1, -1):
            dp[j] = dp[j] or dp[j - num]

    return dp[target]


# ── Coin Change (Unbounded Knapsack) ──────────────
def coin_change(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for coin in coins:
        for a in range(coin, amount + 1):   # forward = reuse allowed
            dp[a] = min(dp[a], dp[a - coin] + 1)

    return dp[amount] if dp[amount] != float('inf') else -1`,
    },
    annotations: [
      { line: 'for w in range(W, weights[i] - 1, -1)', note: 'Reverse iteration ensures each item used at most once (0/1). Forward = unbounded.' },
      { line: 'dp[j] = dp[j] or dp[j - num]', note: 'Boolean knapsack: can we reach sum j using available numbers?' },
      { line: 'for a in range(coin, amount + 1)', note: 'Forward iteration = coins can be reused unlimited times (unbounded variant).' },
    ],
    patterns: [
      { name: '0/1 Knapsack', description: 'Each item once. Reverse inner loop.' },
      { name: 'Unbounded Knapsack', description: 'Items reusable. Forward inner loop.' },
      { name: 'Boolean Knapsack', description: 'Can we reach exact sum? Used in partition, subset sum.' },
    ],
    edgeCases: [
      'W = 0 → dp[0] = 0 by default',
      'No items → cannot fill any capacity',
      'Amount = 0 in coin change → return 0',
      'No combination reaches amount → return -1',
    ],
    leetcodeProblems: [
      { id: 416, title: 'Partition Equal Subset Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/partition-equal-subset-sum/' },
      { id: 322, title: 'Coin Change', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change/' },
      { id: 518, title: 'Coin Change II', difficulty: 'Medium', url: 'https://leetcode.com/problems/coin-change-ii/' },
      { id: 494, title: 'Target Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/target-sum/' },
    ],
    interviewTips: [
      'The direction of the inner loop (forward vs. reverse) is the key to 0/1 vs. unbounded.',
      'Always clarify: can items be reused? That dictates the inner loop direction.',
      'Partition Equal Subset Sum = can we select items summing to total/2?',
    ],
  },

  'dp-lcs': {
    intuition: `Longest Common Subsequence (LCS) and Edit Distance are 2D DP problems operating on two strings. LCS: dp[i][j] = length of LCS of s1[0..i-1] and s2[0..j-1]. If characters match, dp[i][j] = dp[i-1][j-1] + 1; otherwise max(skip s1, skip s2). Edit Distance: minimum operations (insert, delete, replace) to transform s1 into s2.`,
    whenToUse: [
      'Diff tools, version control',
      'DNA sequence alignment',
      'Spell checkers (edit distance)',
      'Longest common subsequence / substring',
    ],
    approach: [
      { step: 1, text: 'Create dp[m+1][n+1] initialized to 0.' },
      { step: 2, text: 'LCS: if s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1.' },
      { step: 3, text: 'LCS: else: dp[i][j] = max(dp[i-1][j], dp[i][j-1]).' },
      { step: 4, text: 'Edit Distance: if match, dp[i][j] = dp[i-1][j-1]; else 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).' },
    ],
    timeComplexity: 'O(m × n)',
    spaceComplexity: 'O(m × n) → O(n) with rolling array',
    complexityNote: 'Each cell computed once. Space optimizable to one row.',
    code: {
      language: 'python',
      code: `# ── Longest Common Subsequence ────────────────────
def lcs(s1: str, s2: str) -> int:
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1         # characters match
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])  # skip one

    return dp[m][n]


# ── Edit Distance (Levenshtein) ───────────────────
def edit_distance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1): dp[i][0] = i   # delete all of word1
    for j in range(n + 1): dp[0][j] = j   # insert all of word2

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i-1] == word2[j-1]:
                dp[i][j] = dp[i-1][j-1]              # no operation needed
            else:
                dp[i][j] = 1 + min(
                    dp[i-1][j],                        # delete from word1
                    dp[i][j-1],                        # insert into word1
                    dp[i-1][j-1]                       # replace
                )

    return dp[m][n]`,
    },
    annotations: [
      { line: 'dp[i][j] = dp[i-1][j-1] + 1', note: 'Characters match — extend the common subsequence by 1.' },
      { line: 'dp[i][j] = max(dp[i-1][j], dp[i][j-1])', note: 'Characters differ — best we can do is skip one character from either string.' },
      { line: 'for i in range(m + 1): dp[i][0] = i', note: 'Base case: transforming word1[0..i] into empty string = i deletions.' },
      { line: '1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])', note: 'Try delete, insert, or replace — take the cheapest.' },
    ],
    patterns: [
      { name: 'LCS → Shortest Common Supersequence', description: 'SCS length = m + n - LCS(s1, s2).' },
      { name: 'LCS → Longest Palindromic Subsequence', description: 'LPS(s) = LCS(s, reverse(s)).' },
    ],
    edgeCases: [
      'Empty string(s) — base cases handle this',
      'Identical strings — LCS = length, edit distance = 0',
      'No common characters — LCS = 0',
    ],
    leetcodeProblems: [
      { id: 1143, title: 'Longest Common Subsequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-common-subsequence/' },
      { id: 72, title: 'Edit Distance', difficulty: 'Hard', url: 'https://leetcode.com/problems/edit-distance/' },
      { id: 1092, title: 'Shortest Common Supersequence', difficulty: 'Hard', url: 'https://leetcode.com/problems/shortest-common-supersequence/' },
      { id: 516, title: 'Longest Palindromic Subsequence', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-subsequence/' },
    ],
    interviewTips: [
      'Draw the DP table for small inputs — it immediately clarifies the transitions.',
      'LCS and Edit Distance tables have the same structure. Learn both in one sitting.',
      'Reconstruct the actual sequence by backtracking through the DP table.',
    ],
  },

  'dp-trees': {
    intuition: `DP on Trees combines tree DFS with memoization. At each node, you compute a value based on its children's values — typical bottom-up post-order traversal. Common patterns: include/exclude the current node (independent set), max path through a node (diameter-like), or subtree aggregations.`,
    whenToUse: [
      'Maximum independent set on tree',
      'Tree diameter / max path sum',
      'Subtree counting / coloring',
      'Binary tree cameras (min cameras)',
    ],
    approach: [
      { step: 1, text: 'Define the DP state at each node (e.g., max sum with/without this node).' },
      { step: 2, text: 'Post-order DFS: compute children\'s states first.' },
      { step: 3, text: 'Combine children\'s values to get the current node\'s state.' },
      { step: 4, text: 'Return value bubbles up to the root.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    complexityNote: 'Each node processed once.',
    code: {
      language: 'python',
      code: `# ── House Robber III (DP on tree) ─────────────────
def rob_tree(root: TreeNode) -> int:
    def dp(node):
        if not node: return (0, 0)       # (rob_this, skip_this)

        left_rob, left_skip   = dp(node.left)
        right_rob, right_skip = dp(node.right)

        # Rob this node: cannot rob children
        rob_this  = node.val + left_skip + right_skip
        # Skip this node: children can be robbed or skipped
        skip_this = max(left_rob, left_skip) + max(right_rob, right_skip)

        return (rob_this, skip_this)

    return max(dp(root))


# ── Max path sum in binary tree ───────────────────
def max_path_sum(root: TreeNode) -> int:
    best = [float('-inf')]

    def max_gain(node):
        if not node: return 0
        left  = max(max_gain(node.left),  0)  # ignore negative paths
        right = max(max_gain(node.right), 0)
        best[0] = max(best[0], node.val + left + right)  # path through node
        return node.val + max(left, right)                # return max arm

    max_gain(root)
    return best[0]`,
    },
    annotations: [
      { line: 'return (rob_this, skip_this)', note: 'Return both states (rob or skip this node) so the parent can choose optimally.' },
      { line: 'left = max(max_gain(node.left), 0)', note: 'Only extend path if it\'s positive — cutting off negative contributions.' },
      { line: 'best[0] = max(best[0], node.val + left + right)', note: 'Update global max with the best path through this node.' },
      { line: 'return node.val + max(left, right)', note: 'Can only contribute one arm upward (a path can\'t branch when going to parent).' },
    ],
    patterns: [
      { name: 'Include/exclude DP', description: 'Return tuple (include_this, exclude_this) for each node.' },
      { name: 'Global variable pattern', description: 'Use a list or nonlocal variable for the global answer when it crosses nodes.' },
    ],
    edgeCases: [
      'Single node tree',
      'All negative values in path sum — answer is a single node',
      'Root-only robber tree',
    ],
    leetcodeProblems: [
      { id: 337, title: 'House Robber III', difficulty: 'Medium', url: 'https://leetcode.com/problems/house-robber-iii/' },
      { id: 124, title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/' },
      { id: 968, title: 'Binary Tree Cameras', difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-cameras/' },
    ],
    interviewTips: [
      'Returning a tuple (with_node, without_node) is the cleanest pattern for tree DP.',
      'Use a list (or nonlocal) to track the global answer when it can\'t be returned in the recursion itself.',
      'Max path sum: don\'t forget to clamp negative contributions to 0.',
    ],
  },

  /* ──────────────────────────────────────────────
     SORTING & SEARCHING
  ────────────────────────────────────────────── */

  'binary-search': {
    intuition: `Binary Search eliminates half of the search space at each step, achieving O(log n) on sorted data. The tricky part is handling boundary conditions (lo, hi inclusive or exclusive) and deciding which half to eliminate. A universal template: lo=0, hi=n-1, while lo<=hi, and eliminate the half that cannot contain the answer.`,
    whenToUse: [
      'Search in sorted array',
      'Find first/last position of target',
      '"Binary search on the answer" — minimize/maximize some value with a monotone predicate',
      'Rotated array search',
    ],
    approach: [
      { step: 1, text: 'Set lo = 0, hi = n - 1.' },
      { step: 2, text: 'Calculate mid = lo + (hi - lo) // 2 (avoids integer overflow).' },
      { step: 3, text: 'If nums[mid] == target: found. If nums[mid] < target: lo = mid + 1. Else: hi = mid - 1.' },
      { step: 4, text: 'Loop exits when lo > hi. Return -1 if not found.' },
    ],
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'Each iteration halves the search space.',
    code: {
      language: 'python',
      code: `# ── Classic binary search ─────────────────────────
def binary_search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1

    while lo <= hi:
        mid = lo + (hi - lo) // 2       # avoids overflow

        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1                 # target in right half
        else:
            hi = mid - 1                 # target in left half

    return -1


# ── Find first occurrence (left bound) ────────────
def left_bound(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    result = -1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] == target:
            result = mid
            hi = mid - 1                 # keep searching left
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return result


# ── Binary search on answer ───────────────────────
def min_eating_speed(piles: list[int], h: int) -> int:
    def can_finish(speed: int) -> bool:
        return sum((p + speed - 1) // speed for p in piles) <= h

    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if can_finish(mid):
            hi = mid                     # try slower speed
        else:
            lo = mid + 1                 # need faster speed
    return lo`,
    },
    annotations: [
      { line: 'mid = lo + (hi - lo) // 2', note: 'Safe mid calculation. (lo + hi) // 2 can overflow in languages with fixed-size integers.' },
      { line: 'result = mid; hi = mid - 1', note: 'Record result but keep searching left for the FIRST occurrence.' },
      { line: 'lo, hi = 1, max(piles)', note: 'Binary search on the answer space (speed), not the array index.' },
    ],
    patterns: [
      { name: 'Classic binary search', description: 'Find exact target. Return -1 if not found.' },
      { name: 'Left/right bound', description: 'Find first or last occurrence of target.' },
      { name: 'Binary search on answer', description: 'Search over the answer space with a monotone predicate.' },
    ],
    edgeCases: [
      'Empty array → return -1',
      'Target not in array → return -1',
      'All same elements → left bound = 0, right bound = n-1',
      'Overflow: use lo + (hi - lo) // 2',
    ],
    leetcodeProblems: [
      { id: 704, title: 'Binary Search', difficulty: 'Easy', url: 'https://leetcode.com/problems/binary-search/' },
      { id: 34, title: 'Find First and Last Position of Element', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/' },
      { id: 875, title: 'Koko Eating Bananas', difficulty: 'Medium', url: 'https://leetcode.com/problems/koko-eating-bananas/' },
      { id: 1011, title: 'Capacity To Ship Packages', difficulty: 'Medium', url: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/' },
    ],
    interviewTips: [
      '"Binary search on the answer" is a power technique — any time you have a monotone predicate, it applies.',
      'Master the left-bound / right-bound variants — they\'re needed for "first/last occurrence" problems.',
      'Check: should your loop be while lo <= hi or while lo < hi? The invariant differs.',
    ],
  },

  'quick-merge': {
    intuition: `QuickSort: choose a pivot, partition array so all elements ≤ pivot go left, > pivot go right, then recurse. Average O(n log n) with random pivots. MergeSort: divide in half, recursively sort, merge. Always O(n log n) and stable. QuickSort wins in practice (cache-friendly), MergeSort wins for stability and linked lists.`,
    whenToUse: [
      'General-purpose sorting (QuickSort)',
      'External sorting, stable sort, linked list sort (MergeSort)',
      'QuickSelect for Kth largest element (partial quicksort)',
    ],
    approach: [
      { step: 1, text: 'QuickSort: pick pivot (usually last element or random). Lomuto partition: swap elements ≤ pivot to the left.' },
      { step: 2, text: 'Recurse on left and right partitions.' },
      { step: 3, text: 'MergeSort: find mid, recurse on halves, merge sorted halves.' },
    ],
    timeComplexity: 'O(n log n) average; O(n²) QuickSort worst case',
    spaceComplexity: 'O(log n) QuickSort stack; O(n) MergeSort merge buffer',
    complexityNote: 'Random pivot selection makes QuickSort O(n log n) expected with high probability.',
    code: {
      language: 'python',
      code: `import random

# ── QuickSort ─────────────────────────────────────
def quicksort(arr: list, lo: int, hi: int):
    if lo < hi:
        pivot_idx = partition(arr, lo, hi)
        quicksort(arr, lo, pivot_idx - 1)
        quicksort(arr, pivot_idx + 1, hi)

def partition(arr: list, lo: int, hi: int) -> int:
    # Randomize pivot to avoid O(n²) on sorted input
    r = random.randint(lo, hi)
    arr[r], arr[hi] = arr[hi], arr[r]

    pivot = arr[hi]
    i = lo - 1                           # i = rightmost "≤ pivot" boundary

    for j in range(lo, hi):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[hi] = arr[hi], arr[i + 1]
    return i + 1


# ── MergeSort ─────────────────────────────────────
def mergesort(arr: list) -> list:
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left  = mergesort(arr[:mid])
    right = mergesort(arr[mid:])
    return merge(left, right)

def merge(left: list, right: list) -> list:
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
    },
    annotations: [
      { line: 'r = random.randint(lo, hi)', note: 'Random pivot prevents O(n²) worst case on already-sorted inputs.' },
      { line: 'i = lo - 1', note: 'i marks the boundary of the "≤ pivot" region. All elements 0..i are ≤ pivot.' },
      { line: 'arr[i + 1], arr[hi] = arr[hi], arr[i + 1]', note: 'Place pivot in its final sorted position.' },
    ],
    patterns: [
      { name: 'QuickSelect', description: 'Find Kth largest in O(n) average. Partition once, recurse on one side only.' },
      { name: 'Dutch National Flag', description: 'Three-way partition for arrays with duplicates (e.g., Sort Colors).' },
    ],
    edgeCases: [
      'Already sorted → QuickSort degrades to O(n²) without random pivot',
      'All duplicates → use three-way partition',
      'Empty or single-element array → base case',
    ],
    leetcodeProblems: [
      { id: 912, title: 'Sort an Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-an-array/' },
      { id: 215, title: 'Kth Largest Element in an Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
      { id: 75, title: 'Sort Colors', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-colors/' },
      { id: 148, title: 'Sort List', difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-list/' },
    ],
    interviewTips: [
      'Always randomize QuickSort pivot in an interview — sorted input is a common trap.',
      'QuickSelect finds Kth element in O(n) average: partition and only recurse into the half containing k.',
      'MergeSort is stable; QuickSort (as implemented) is not.',
    ],
  },

  'rotated-array': {
    intuition: `A rotated sorted array has one "break point" where the order resets. Key insight: one half of the array is always sorted. Use binary search, determine which half is sorted, then decide which half the target is in.`,
    whenToUse: [
      'Search in rotated sorted array',
      'Find minimum in rotated array',
      'Peak element problems',
    ],
    approach: [
      { step: 1, text: 'Set lo = 0, hi = n - 1.' },
      { step: 2, text: 'If nums[mid] == target: return mid.' },
      { step: 3, text: 'Determine which half is sorted: if nums[lo] <= nums[mid], left half is sorted.' },
      { step: 4, text: 'Check if target is in the sorted half; if yes, search there; otherwise search the other half.' },
    ],
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'Binary search despite the rotation.',
    code: {
      language: 'python',
      code: `def search_rotated(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1

    while lo <= hi:
        mid = lo + (hi - lo) // 2

        if nums[mid] == target:
            return mid

        if nums[lo] <= nums[mid]:        # left half is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1            # target in left sorted half
            else:
                lo = mid + 1            # target in right half
        else:                            # right half is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1            # target in right sorted half
            else:
                hi = mid - 1            # target in left half

    return -1


# ── Find minimum in rotated sorted array ──────────
def find_min(nums: list[int]) -> int:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1               # min is in right half
        else:
            hi = mid                   # mid could be the min
    return nums[lo]`,
    },
    annotations: [
      { line: 'if nums[lo] <= nums[mid]', note: 'Key test: if left boundary ≤ mid, the left half has no rotation break.' },
      { line: 'if nums[lo] <= target < nums[mid]', note: 'Target is inside the sorted left half — eliminate the right.' },
      { line: 'if nums[mid] > nums[hi]: lo = mid + 1', note: 'Min in rotated: if mid > right boundary, the minimum is in the right half.' },
    ],
    patterns: [],
    edgeCases: [
      'No rotation (array already sorted) — algorithm handles it (left half always "sorted")',
      'Duplicates — add special handling when nums[lo] == nums[mid] == nums[hi]',
      'Single element',
    ],
    leetcodeProblems: [
      { id: 33, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
      { id: 81, title: 'Search in Rotated Sorted Array II (with duplicates)', difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array-ii/' },
      { id: 153, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },
    ],
    interviewTips: [
      'The key insight: one half is ALWAYS sorted. Use that to determine where the target could be.',
      'Draw 2-3 example rotations on paper to build intuition.',
      'Handle duplicates (LC 81): if nums[lo] == nums[mid] == nums[hi], shrink both ends: lo++, hi--.',
    ],
  },

  /* ──────────────────────────────────────────────
     STACK & QUEUE
  ────────────────────────────────────────────── */

  'monotonic-stack': {
    intuition: `A Monotonic Stack maintains elements in strictly increasing or decreasing order. When a new element violates the order, we pop elements until the order is restored — and the popped element's relationship with the new element is the answer. Used to find "next greater/smaller" elements efficiently in O(n).`,
    whenToUse: [
      'Next Greater Element',
      'Next Smaller Element',
      'Largest Rectangle in Histogram',
      'Daily Temperatures',
      'Stock Span Problem',
    ],
    approach: [
      { step: 1, text: 'Initialize an empty stack (stores indices or values).' },
      { step: 2, text: 'Iterate through the array.' },
      { step: 3, text: 'While stack is non-empty and the monotonic property is violated: pop the stack and record the answer for the popped element (the current element is the "next greater/smaller").' },
      { step: 4, text: 'Push the current element.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    complexityNote: 'Each element pushed and popped at most once.',
    code: {
      language: 'python',
      code: `# ── Next Greater Element ─────────────────────────
def next_greater(nums: list[int]) -> list[int]:
    result = [-1] * len(nums)
    stack = []                           # monotonic decreasing stack of indices

    for i, num in enumerate(nums):
        while stack and nums[stack[-1]] < num:
            idx = stack.pop()
            result[idx] = num            # num is the next greater for idx
        stack.append(i)

    return result  # remaining stack elements have no next greater → -1


# ── Daily Temperatures ────────────────────────────
def daily_temperatures(temps: list[int]) -> list[int]:
    result = [0] * len(temps)
    stack = []                           # indices of unresolved days

    for i, temp in enumerate(temps):
        while stack and temps[stack[-1]] < temp:
            j = stack.pop()
            result[j] = i - j           # days to wait
        stack.append(i)

    return result


# ── Largest Rectangle in Histogram ────────────────
def largest_rectangle(heights: list[int]) -> int:
    stack = [-1]                         # sentinel
    max_area = 0

    for i, h in enumerate(heights):
        while stack[-1] != -1 and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            width  = i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    while stack[-1] != -1:
        height = heights[stack.pop()]
        width  = len(heights) - stack[-1] - 1
        max_area = max(max_area, height * width)

    return max_area`,
    },
    annotations: [
      { line: 'while stack and nums[stack[-1]] < num', note: 'Current element is "greater" than top — pop and record it as the answer for top.' },
      { line: 'result[idx] = num', note: 'The element we just popped now has its "next greater" answer: the current num.' },
      { line: 'stack = [-1]  # sentinel', note: 'Sentinel -1 simplifies width calculation without needing an if-empty check.' },
      { line: 'width = i - stack[-1] - 1', note: 'Width = from current position back to the previous bar that wasn\'t popped.' },
    ],
    patterns: [
      { name: 'Monotonic decreasing stack', description: 'For "next greater" problems. Stack stays in decreasing order.' },
      { name: 'Monotonic increasing stack', description: 'For "next smaller" problems. Stack stays in increasing order.' },
    ],
    edgeCases: [
      'All same elements → no element has a next greater → all -1',
      'Strictly decreasing array → stack never pops → all -1',
      'Histogram with zero-height bars',
    ],
    leetcodeProblems: [
      { id: 739, title: 'Daily Temperatures', difficulty: 'Medium', url: 'https://leetcode.com/problems/daily-temperatures/' },
      { id: 496, title: 'Next Greater Element I', difficulty: 'Easy', url: 'https://leetcode.com/problems/next-greater-element-i/' },
      { id: 84, title: 'Largest Rectangle in Histogram', difficulty: 'Hard', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/' },
      { id: 85, title: 'Maximal Rectangle', difficulty: 'Hard', url: 'https://leetcode.com/problems/maximal-rectangle/' },
    ],
    interviewTips: [
      'Store indices, not values, so you can compute distances (Daily Temperatures) and widths (Histogram).',
      'Sentinel (-1) in histogram avoids edge cases when the stack becomes empty during cleanup.',
      'The "cleanup" after the main loop handles elements with no next-greater.',
    ],
  },

  'next-greater': {
    intuition: `Next Greater Element is the direct application of the Monotonic Stack. For circular arrays, the trick is to iterate twice (or use modulo). The stack efficiently answers "what is the next element larger than me?" for every position in one pass.`,
    whenToUse: [
      'NGE on linear arrays',
      'NGE on circular arrays',
      'Previous greater / previous smaller (iterate in reverse)',
    ],
    approach: [
      { step: 1, text: 'Use a monotonic decreasing stack of indices.' },
      { step: 2, text: 'For circular arrays, iterate i from 0 to 2n-1, use i % n for index.' },
      { step: 3, text: 'Only push indices for the first n iterations.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    complexityNote: 'Each index pushed and popped at most once. Circular variant: 2n iterations, still O(n).',
    code: {
      language: 'python',
      code: `# ── Next Greater Element II (circular array) ──────
def next_greater_circular(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [-1] * n
    stack = []

    for i in range(2 * n):              # iterate twice for circular effect
        while stack and nums[stack[-1]] < nums[i % n]:
            idx = stack.pop()
            result[idx] = nums[i % n]
        if i < n:                        # only push first n elements
            stack.append(i)

    return result


# ── Previous Greater Element (iterate in reverse) ─
def prev_greater(nums: list[int]) -> list[int]:
    result = [-1] * len(nums)
    stack = []

    for i in range(len(nums) - 1, -1, -1):
        while stack and stack[-1] <= nums[i]:
            stack.pop()
        result[i] = stack[-1] if stack else -1
        stack.append(nums[i])

    return result`,
    },
    annotations: [
      { line: 'for i in range(2 * n)', note: 'Circular trick: iterate 2n times to "wrap around." Elements after position n act as the circular continuation.' },
      { line: 'if i < n: stack.append(i)', note: 'Only push real indices (0 to n-1). The second pass only resolves outstanding elements.' },
    ],
    patterns: [],
    edgeCases: [
      'All same elements — result is all -1',
      'Strictly increasing → each element\'s NGE is the next element',
      'Single element circular → no NGE → -1',
    ],
    leetcodeProblems: [
      { id: 503, title: 'Next Greater Element II', difficulty: 'Medium', url: 'https://leetcode.com/problems/next-greater-element-ii/' },
      { id: 901, title: 'Online Stock Span', difficulty: 'Medium', url: 'https://leetcode.com/problems/online-stock-span/' },
      { id: 42, title: 'Trapping Rain Water', difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water/' },
    ],
    interviewTips: [
      'The "2n iteration" trick for circular arrays is a classic interview technique to know.',
      'Previous Greater Element: same logic but iterate right-to-left.',
    ],
  },

  'sliding-max': {
    intuition: `Sliding Window Maximum maintains the maximum of a sliding window of size k efficiently. A brute force approach is O(nk). The optimal approach uses a monotonic deque (double-ended queue) that stores indices and maintains a decreasing order of values — the front is always the current window's maximum.`,
    whenToUse: [
      'Maximum/minimum of every window of size k',
      'Jump Game VI (max score in window)',
      'Any "query the max in a recent k-length window"',
    ],
    approach: [
      { step: 1, text: 'Use a deque to store indices in decreasing value order.' },
      { step: 2, text: 'For each new element: remove indices outside the window from the front.' },
      { step: 3, text: 'Remove smaller elements from the back (they can never be the max).' },
      { step: 4, text: 'Push current index. Append deque front to results once window is full.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(k)',
    complexityNote: 'Each element added/removed from deque at most once.',
    code: {
      language: 'python',
      code: `from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    dq = deque()                         # stores indices (decreasing value order)
    result = []

    for i, num in enumerate(nums):
        # Remove indices outside the window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Remove smaller elements from back (they're useless)
        while dq and nums[dq[-1]] < num:
            dq.pop()

        dq.append(i)

        if i >= k - 1:                   # window is full
            result.append(nums[dq[0]])   # front = current window max

    return result`,
    },
    annotations: [
      { line: 'while dq and dq[0] < i - k + 1', note: 'Evict indices that have left the window from the front.' },
      { line: 'while dq and nums[dq[-1]] < num', note: 'Remove smaller values from the back — they\'ll never be the max while current element exists.' },
      { line: 'result.append(nums[dq[0]])', note: 'Deque front is always the index of the maximum in the current window.' },
    ],
    patterns: [],
    edgeCases: [
      'k = 1 → every element is its own max',
      'k >= n → max of entire array',
      'All same elements → max = that element',
    ],
    leetcodeProblems: [
      { id: 239, title: 'Sliding Window Maximum', difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/' },
      { id: 1696, title: 'Jump Game VI', difficulty: 'Medium', url: 'https://leetcode.com/problems/jump-game-vi/' },
    ],
    interviewTips: [
      'A deque combines O(1) front access (for max) and O(1) back pop (for cleanup) — that\'s why it\'s perfect here.',
      'Store indices (not values) in the deque so you can check if an index has left the window.',
    ],
  },

  /* ──────────────────────────────────────────────
     BACKTRACKING
  ────────────────────────────────────────────── */

  'subsets-perms': {
    intuition: `Backtracking systematically explores all possibilities by building a candidate solution incrementally and abandoning ("pruning") it as soon as it's determined invalid. For subsets: at each element, choose to include or exclude it. For permutations: at each position, place each unused element. A state-space tree visualizes the recursion.`,
    whenToUse: [
      'Generate all subsets / power set',
      'Generate all permutations',
      'Combinations sum',
      'Phone letter combinations',
    ],
    approach: [
      { step: 1, text: 'Define the recursive function with current state (path, start index, etc.).' },
      { step: 2, text: 'Base case: add current path to results.' },
      { step: 3, text: 'Iterate choices, make a choice, recurse, undo the choice (backtrack).' },
    ],
    timeComplexity: 'O(2^n × n) subsets; O(n! × n) permutations',
    spaceComplexity: 'O(n) recursion depth',
    complexityNote: 'Exponential — inherent to enumeration problems. Pruning reduces constant factor.',
    code: {
      language: 'python',
      code: `# ── All Subsets ───────────────────────────────────
def subsets(nums: list[int]) -> list[list[int]]:
    result = []

    def backtrack(start: int, path: list):
        result.append(path[:])           # snapshot current subset

        for i in range(start, len(nums)):
            path.append(nums[i])         # choose
            backtrack(i + 1, path)       # explore
            path.pop()                   # unchoose (backtrack)

    backtrack(0, [])
    return result


# ── All Permutations ──────────────────────────────
def permutations(nums: list[int]) -> list[list[int]]:
    result = []

    def backtrack(path: list, used: set):
        if len(path) == len(nums):
            result.append(path[:])
            return

        for num in nums:
            if num in used: continue     # skip used elements
            used.add(num)
            path.append(num)
            backtrack(path, used)
            path.pop()
            used.remove(num)

    backtrack([], set())
    return result


# ── Combination Sum (with reuse) ──────────────────
def combination_sum(candidates: list[int], target: int) -> list[list[int]]:
    result = []

    def backtrack(start: int, path: list, remaining: int):
        if remaining == 0:
            result.append(path[:]); return
        if remaining < 0:
            return                       # prune: exceeded target

        for i in range(start, len(candidates)):
            path.append(candidates[i])
            backtrack(i, path, remaining - candidates[i])  # i (not i+1) = reuse
            path.pop()

    backtrack(0, [], target)
    return result`,
    },
    annotations: [
      { line: 'result.append(path[:])', note: 'Snapshot (copy) the path — don\'t append the reference as it will mutate.' },
      { line: 'path.pop()  # unchoose (backtrack)', note: 'This single line is the "backtrack" — undo the choice to try the next option.' },
      { line: 'if num in used: continue', note: 'Permutations: skip elements already in the current path.' },
      { line: 'backtrack(i, path, remaining - candidates[i])  # i (not i+1) = reuse', note: 'Pass i (same index) to allow reusing the same candidate.' },
    ],
    patterns: [
      { name: 'Choose / Explore / Unchoose', description: 'The universal backtracking template.' },
      { name: 'Start index to avoid duplicates', description: 'For subsets and combinations, pass start index to avoid revisiting elements.' },
      { name: 'Used set for permutations', description: 'Track which elements are in the current path.' },
    ],
    edgeCases: [
      'Empty input → return [[]] for subsets',
      'Single element → two subsets: [] and [element]',
      'Duplicates in input → sort first and skip duplicates to avoid duplicate subsets/permutations',
    ],
    leetcodeProblems: [
      { id: 78, title: 'Subsets', difficulty: 'Medium', url: 'https://leetcode.com/problems/subsets/' },
      { id: 46, title: 'Permutations', difficulty: 'Medium', url: 'https://leetcode.com/problems/permutations/' },
      { id: 39, title: 'Combination Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/combination-sum/' },
      { id: 90, title: 'Subsets II (with duplicates)', difficulty: 'Medium', url: 'https://leetcode.com/problems/subsets-ii/' },
      { id: 17, title: 'Letter Combinations of a Phone Number', difficulty: 'Medium', url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/' },
    ],
    interviewTips: [
      'The backtracking template is: choose → recurse → unchoose. Memorize this.',
      'Always take a snapshot with path[:] when adding to results.',
      'To handle duplicates: sort first, then skip if nums[i] == nums[i-1] at the same level.',
    ],
  },

  'n-queens': {
    intuition: `N-Queens places N queens on an N×N chessboard so no two queens attack each other. Queens attack in the same row, column, or diagonal. We place one queen per row, tracking which columns and diagonals are used. Key insight: two queens on the same diagonal satisfy (row1 - col1 == row2 - col2) or (row1 + col1 == row2 + col2).`,
    whenToUse: [
      'Classic constraint satisfaction problem',
      'Grid placement with conflict constraints',
      'Illustrates backtracking with complex pruning',
    ],
    approach: [
      { step: 1, text: 'Track used columns, main diagonals (row-col), and anti-diagonals (row+col) in sets.' },
      { step: 2, text: 'Place a queen in each column of the current row if not conflicting.' },
      { step: 3, text: 'Recurse to the next row. If all N rows placed, record the board.' },
      { step: 4, text: 'Backtrack by removing the queen and its conflict markers.' },
    ],
    timeComplexity: 'O(n!)',
    spaceComplexity: 'O(n²)',
    complexityNote: 'Pruning makes it much faster in practice. Roughly O(n!) as an upper bound.',
    code: {
      language: 'python',
      code: `def solve_n_queens(n: int) -> list[list[str]]:
    results = []
    queens = []                          # queens[row] = col of queen in that row
    cols     = set()
    diag1    = set()                     # row - col (same for main diagonal)
    diag2    = set()                     # row + col (same for anti-diagonal)

    def backtrack(row: int):
        if row == n:
            board = []
            for r in range(n):
                row_str = '.' * queens[r] + 'Q' + '.' * (n - queens[r] - 1)
                board.append(row_str)
            results.append(board)
            return

        for col in range(n):
            if col in cols or (row-col) in diag1 or (row+col) in diag2:
                continue                 # conflict — skip this column

            # Place queen
            queens.append(col)
            cols.add(col); diag1.add(row-col); diag2.add(row+col)

            backtrack(row + 1)

            # Remove queen (backtrack)
            queens.pop()
            cols.remove(col); diag1.remove(row-col); diag2.remove(row+col)

    backtrack(0)
    return results`,
    },
    annotations: [
      { line: 'diag1 = set()  # row - col', note: 'All cells on the same main diagonal have the same (row - col) value.' },
      { line: 'diag2 = set()  # row + col', note: 'All cells on the same anti-diagonal have the same (row + col) value.' },
      { line: 'if col in cols or (row-col) in diag1 or (row+col) in diag2:', note: 'O(1) conflict check for all three attack directions.' },
    ],
    patterns: [],
    edgeCases: [
      'n = 1 → one solution: single queen on the only square',
      'n = 2 or n = 3 → no solutions',
      'n = 4 → two solutions',
    ],
    leetcodeProblems: [
      { id: 51, title: 'N-Queens', difficulty: 'Hard', url: 'https://leetcode.com/problems/n-queens/' },
      { id: 52, title: 'N-Queens II (count solutions)', difficulty: 'Hard', url: 'https://leetcode.com/problems/n-queens-ii/' },
    ],
    interviewTips: [
      'The diagonal encoding (row±col) is the cleverest part — highlight this to the interviewer.',
      'Using sets gives O(1) conflict checks, making the solution cleaner than a visited matrix.',
    ],
  },

  'sudoku': {
    intuition: `Sudoku Solver uses backtracking with constraint propagation. For each empty cell, try digits 1-9. If valid (not in same row, col, or 3×3 box), place and recurse. If no digit works, backtrack. Key optimization: find the cell with the fewest valid options ("most constrained variable" heuristic) to reduce branching.`,
    whenToUse: [
      'Constraint satisfaction problems',
      'Grid filling with row/col/box constraints',
    ],
    approach: [
      { step: 1, text: 'Find the next empty cell (\'.\').' },
      { step: 2, text: 'Try digits 1-9. Check validity: not in same row, column, or 3×3 box.' },
      { step: 3, text: 'If valid: place digit, recurse, remove if recursion fails.' },
      { step: 4, text: 'If all cells filled: return True.' },
    ],
    timeComplexity: 'O(9^(n)) where n = number of empty cells',
    spaceComplexity: 'O(1) extra (in-place)',
    complexityNote: 'Constraint propagation drastically prunes the search space in practice.',
    code: {
      language: 'python',
      code: `def solve_sudoku(board: list[list[str]]) -> None:
    def is_valid(row: int, col: int, num: str) -> bool:
        box_r, box_c = 3 * (row // 3), 3 * (col // 3)
        for i in range(9):
            if board[row][i] == num: return False      # same row
            if board[i][col] == num: return False      # same col
            if board[box_r + i//3][box_c + i%3] == num: return False  # same box
        return True

    def backtrack() -> bool:
        for r in range(9):
            for c in range(9):
                if board[r][c] == '.':
                    for num in '123456789':
                        if is_valid(r, c, num):
                            board[r][c] = num
                            if backtrack(): return True
                            board[r][c] = '.'   # undo
                    return False                # no valid digit → backtrack
        return True                             # no empty cell found → solved

    backtrack()`,
    },
    annotations: [
      { line: 'if board[box_r + i//3][box_c + i%3] == num', note: 'Compact 3×3 box check using integer division and modulo.' },
      { line: 'return False  # no valid digit → backtrack', note: 'Critical: explicit return False triggers backtracking in the parent call.' },
      { line: 'return True   # no empty cell found → solved', note: 'When all cells are filled, propagate success upward.' },
    ],
    patterns: [],
    edgeCases: [
      'Already solved board → return immediately',
      'Contradictory board → backtracking will exhaust all options and return False',
    ],
    leetcodeProblems: [
      { id: 37, title: 'Sudoku Solver', difficulty: 'Hard', url: 'https://leetcode.com/problems/sudoku-solver/' },
      { id: 36, title: 'Valid Sudoku', difficulty: 'Medium', url: 'https://leetcode.com/problems/valid-sudoku/' },
    ],
    interviewTips: [
      'The box index formula (3*(r//3) + c//3) is a must-know for Sudoku problems.',
      'For interviews, mention constraint propagation as an advanced optimization even if you don\'t implement it.',
    ],
  },

  /* ──────────────────────────────────────────────
     BIT MANIPULATION
  ────────────────────────────────────────────── */

  'xor-tricks': {
    intuition: `XOR has magical properties: X ^ X = 0 (self-cancellation), X ^ 0 = X (identity), and it's commutative and associative. This makes it perfect for "find the unique element" — XOR all elements, pairs cancel, leaving the singleton. Also used for swapping without a temp variable and finding missing numbers.`,
    whenToUse: [
      'Find the single non-duplicate element',
      'Find two numbers appearing an odd number of times',
      'Missing number in range',
      'Swap two numbers without extra variable',
    ],
    approach: [
      { step: 1, text: 'XOR all elements. Pairs cancel (X ^ X = 0). The single element remains.' },
      { step: 2, text: 'For two unique elements: find any set bit in their XOR, use it to partition into two groups.' },
    ],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityNote: 'Single pass, no extra space.',
    code: {
      language: 'python',
      code: `# ── Single Number ─────────────────────────────────
def single_number(nums: list[int]) -> int:
    result = 0
    for num in nums:
        result ^= num                    # pairs cancel: X^X = 0
    return result


# ── Missing Number (XOR with indices) ─────────────
def missing_number(nums: list[int]) -> int:
    xor = len(nums)                      # XOR with n first
    for i, num in enumerate(nums):
        xor ^= i ^ num                   # XOR index and value
    return xor                           # paired elements cancel, missing remains


# ── Find Two Unique Numbers ────────────────────────
def single_number_iii(nums: list[int]) -> list[int]:
    xor = 0
    for num in nums:
        xor ^= num                       # XOR of the two unique numbers

    # Find a bit that differs between the two uniques
    diff_bit = xor & (-xor)             # isolate rightmost set bit

    a = b = 0
    for num in nums:
        if num & diff_bit:              # partition into two groups
            a ^= num
        else:
            b ^= num
    return [a, b]


# ── Swap without temp ─────────────────────────────
def swap_xor(a: int, b: int) -> tuple:
    a ^= b
    b ^= a                              # b = original a
    a ^= b                              # a = original b
    return a, b`,
    },
    annotations: [
      { line: 'result ^= num', note: 'XOR is associative and commutative. All duplicates cancel (X^X=0). Single element survives.' },
      { line: 'diff_bit = xor & (-xor)', note: 'Isolate the rightmost set bit. Any bit that\'s 1 in xor means the two uniques differ there.' },
      { line: 'if num & diff_bit:', note: 'Partition: elements with that bit set go to group A, others to B. Each group has one unique.' },
    ],
    patterns: [
      { name: 'XOR cancellation', description: 'Find single unique element among duplicates.' },
      { name: 'Rightmost set bit isolation', description: 'xor & (-xor) to split numbers by a differing bit.' },
    ],
    edgeCases: [
      'Single element array → that element is the answer',
      'All same elements (edge of "single number") → 0',
      'Missing number with n = 0 → answer is 0',
    ],
    leetcodeProblems: [
      { id: 136, title: 'Single Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/single-number/' },
      { id: 260, title: 'Single Number III', difficulty: 'Medium', url: 'https://leetcode.com/problems/single-number-iii/' },
      { id: 268, title: 'Missing Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/missing-number/' },
      { id: 421, title: 'Maximum XOR of Two Numbers in an Array', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/' },
    ],
    interviewTips: [
      'XOR is your first instinct when you see "find the one that appears once among pairs."',
      'For two unique numbers: XOR all → find any set bit → use it to split into two independent "single number" problems.',
      'The -x trick (two\'s complement) to isolate rightmost bit is worth memorizing: x & (-x).',
    ],
  },

  'bit-count': {
    intuition: `Counting set bits (Hamming Weight / popcount) is a core bit manipulation skill. Naive: shift 32 times. Better: Brian Kernighan's trick — n & (n-1) removes the lowest set bit, so we loop only k times (k = number of set bits). DP approach: dp[i] = dp[i >> 1] + (i & 1).`,
    whenToUse: [
      'Count bits in a number',
      'Count bits for 0 through n (LC 338)',
      'Check power of 2',
      'Subset enumeration using bitmask',
    ],
    approach: [
      { step: 1, text: 'Brian Kernighan: while n > 0, count++, n = n & (n-1). Loop runs k times.' },
      { step: 2, text: 'DP for range: dp[i] = dp[i >> 1] + (i & 1). Each number has one more bit than i//2 if odd.' },
    ],
    timeComplexity: 'O(k) Kernighan; O(n) for range 0..n',
    spaceComplexity: 'O(1) / O(n)',
    complexityNote: 'Kernighan loops only for set bits, not all 32/64 bits.',
    code: {
      language: 'python',
      code: `# ── Hamming Weight (Brian Kernighan) ──────────────
def hamming_weight(n: int) -> int:
    count = 0
    while n:
        n &= n - 1                       # clear lowest set bit
        count += 1
    return count


# ── Count Bits for 0..n (DP) ──────────────────────
def count_bits(n: int) -> list[int]:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)   # dp[i//2] + is_odd(i)
    return dp


# ── Power of Two ──────────────────────────────────
def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0  # power of 2 has exactly one set bit


# ── Number of 1 Bits (built-in) ───────────────────
def popcount(n: int) -> int:
    return bin(n).count('1')             # pythonic (not O(1) but readable)`,
    },
    annotations: [
      { line: 'n &= n - 1', note: 'Clears the lowest set bit. A power of 2 has only one set bit, so this makes n = 0 immediately.' },
      { line: 'dp[i] = dp[i >> 1] + (i & 1)', note: 'i >> 1 = i // 2 (which we already computed). Add 1 if i is odd (has an extra set LSB).' },
      { line: 'return n > 0 and (n & (n - 1)) == 0', note: 'Power of 2: exactly one bit set. n & (n-1) == 0 iff exactly one bit set.' },
    ],
    patterns: [],
    edgeCases: [
      'n = 0: 0 set bits',
      'Negative numbers in two\'s complement: use n & 0xFFFFFFFF for 32-bit',
      'Power of 2 check: must also verify n > 0',
    ],
    leetcodeProblems: [
      { id: 191, title: 'Number of 1 Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/' },
      { id: 338, title: 'Counting Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/counting-bits/' },
      { id: 231, title: 'Power of Two', difficulty: 'Easy', url: 'https://leetcode.com/problems/power-of-two/' },
    ],
    interviewTips: [
      'Brian Kernighan\'s trick is a classic interview bit question — know it cold.',
      'Count Bits 0..n: the DP recurrence dp[i] = dp[i//2] + (i%2) is elegant and O(n).',
      'Power of 2: single line n > 0 && (n & n-1) == 0.',
    ],
  },

  'power-of-2': {
    intuition: `Power of two / three / four checks use bit manipulation or math. A power of 2 has exactly one set bit: n & (n-1) == 0. Power of 3: no bit trick — use logarithm or check if 3^19 (max int power of 3) is divisible. These small problems test bit manipulation fundamentals.`,
    whenToUse: [
      'Check power of 2, 3, 4',
      'Bit counting fundamentals',
      'Bitmask generation (1 << k)',
    ],
    approach: [
      { step: 1, text: 'Power of 2: return n > 0 && (n & (n-1)) == 0.' },
      { step: 2, text: 'Power of 4: must be power of 2 AND the single bit is at an even position. Check: (n & 0xAAAAAAAA) == 0.' },
      { step: 3, text: 'Power of 3: no bit trick. Check 1162261467 % n == 0 (3^19 is largest int power of 3).' },
    ],
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    complexityNote: 'All checks are constant-time arithmetic.',
    code: {
      language: 'python',
      code: `# ── Power of Two ──────────────────────────────────
def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0


# ── Power of Four ──────────────────────────────────
def is_power_of_four(n: int) -> bool:
    # Power of 2 AND single bit at even position (bit 0, 2, 4...)
    # 0xAAAAAAAA = ...10101010 (bits at odd positions)
    return n > 0 and (n & (n - 1)) == 0 and (n & 0xAAAAAAAA) == 0


# ── Power of Three ────────────────────────────────
def is_power_of_three(n: int) -> bool:
    # 3^19 = 1162261467 is largest power of 3 that fits in 32-bit int
    return n > 0 and 1162261467 % n == 0


# ── Bitmask tricks ────────────────────────────────
# Check if kth bit is set:
def is_kth_bit_set(n: int, k: int) -> bool:
    return bool(n & (1 << k))

# Set kth bit:
def set_kth_bit(n: int, k: int) -> int:
    return n | (1 << k)

# Clear kth bit:
def clear_kth_bit(n: int, k: int) -> int:
    return n & ~(1 << k)

# Toggle kth bit:
def toggle_kth_bit(n: int, k: int) -> int:
    return n ^ (1 << k)`,
    },
    annotations: [
      { line: 'return n > 0 and (n & (n - 1)) == 0', note: 'Powers of 2 have exactly one set bit. n & (n-1) clears it; result is 0 iff only one bit was set.' },
      { line: 'and (n & 0xAAAAAAAA) == 0', note: '0xAAAAAAAA has 1s at all odd bit positions. If n\'s single bit is at an even position (0,2,4...), this mask gives 0.' },
      { line: 'return n > 0 and 1162261467 % n == 0', note: 'Every power of 3 divides 3^19. Elegant constant-time check.' },
    ],
    patterns: [],
    edgeCases: [
      'n = 0: not a power of any positive integer',
      'n = 1: power of 2, 3, and 4 (3^0 = 4^0 = 2^0 = 1)',
      'Negative numbers: return False immediately',
    ],
    leetcodeProblems: [
      { id: 231, title: 'Power of Two', difficulty: 'Easy', url: 'https://leetcode.com/problems/power-of-two/' },
      { id: 326, title: 'Power of Three', difficulty: 'Easy', url: 'https://leetcode.com/problems/power-of-three/' },
      { id: 342, title: 'Power of Four', difficulty: 'Easy', url: 'https://leetcode.com/problems/power-of-four/' },
      { id: 191, title: 'Number of 1 Bits', difficulty: 'Easy', url: 'https://leetcode.com/problems/number-of-1-bits/' },
    ],
    interviewTips: [
      'These "easy" problems are often asked in phone screens. Know them cold.',
      'The bitmask operations (set, clear, toggle, check) are used in bitmask DP — know all four.',
      'Power of 4: it\'s power of 2 AND bit is at an even position.',
    ],
  },
};
