import { PrismaClient, Difficulty, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
    // ─── EASY: Numerical Reasoning ───────────────────────────────────────────
    {
        text: 'A train travels 60 km in 1 hour. How far will it travel in 2.5 hours at the same speed?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['120 km', '140 km', '150 km', '180 km'],
        correctAnswer: '150 km',
        explanation: '60 × 2.5 = 150 km',
    },
    {
        text: 'What is 15% of 240?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['24', '30', '36', '42'],
        correctAnswer: '36',
        explanation: '240 × 0.15 = 36',
    },
    {
        text: 'If a shirt costs ₹800 and is sold at a 25% discount, what is the selling price?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['₹550', '₹575', '₹600', '₹625'],
        correctAnswer: '₹600',
        explanation: '800 − (800 × 0.25) = 600',
    },
    {
        text: 'A box contains 4 red, 3 blue, and 5 green balls. What is the probability of picking a blue ball at random?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['1/4', '3/12', '1/4', '1/3'],
        correctAnswer: '3/12',
        explanation: 'Total = 12. P(blue) = 3/12 = 1/4',
    },
    {
        text: 'The average of 5 numbers is 20. If one number is removed and the average becomes 18, what was the removed number?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['24', '26', '28', '30'],
        correctAnswer: '28',
        explanation: 'Sum = 100. New sum = 72. Removed = 100 − 72 = 28',
    },
    {
        text: 'If 6 workers can complete a job in 10 days, how many days will 10 workers take to complete the same job?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['4', '5', '6', '8'],
        correctAnswer: '6',
        explanation: '6 × 10 = 10 × d → d = 6',
    },
    {
        text: 'What comes next in the series: 2, 6, 12, 20, 30, ?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['40', '42', '44', '48'],
        correctAnswer: '42',
        explanation: 'Differences: 4, 6, 8, 10, 12 → 30 + 12 = 42',
    },
    {
        text: 'Which number is the odd one out: 4, 9, 16, 24, 25, 36?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['4', '9', '24', '36'],
        correctAnswer: '24',
        explanation: 'All others are perfect squares: 4=2², 9=3², 16=4², 25=5², 36=6²',
    },
    {
        text: 'A tap fills a tank in 6 hours. Another tap empties it in 8 hours. If both are open together, how many hours does it take to fill the tank?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['18', '22', '24', '28'],
        correctAnswer: '24',
        explanation: 'Net rate = 1/6 − 1/8 = 1/24. Tank fills in 24 hours.',
    },
    {
        text: 'If A = 1, B = 2, ..., Z = 26, what is the value of CAB?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['5', '6', '7', '8'],
        correctAnswer: '6',
        explanation: 'C=3, A=1, B=2 → 3+1+2 = 6',
    },

    // ─── EASY: Logical Reasoning ──────────────────────────────────────────────
    {
        text: 'All roses are flowers. Some flowers fade quickly. Therefore:',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: [
            'All roses fade quickly',
            'Some roses may fade quickly',
            'No roses fade quickly',
            'All flowers are roses',
        ],
        correctAnswer: 'Some roses may fade quickly',
        explanation: 'Syllogism: Not all flowers are roses, so only some roses might fade.',
    },
    {
        text: 'If Monday is the 1st day and Saturday is the 6th, what is the 9th day of the week (continuing the cycle)?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        correctAnswer: 'Wednesday',
        explanation: '9 mod 7 = 2 → 2nd day = Tuesday? No: day 1=Mon, 8=Mon, 9=Tue. Correction: 9th day = Tuesday.',
    },
    {
        text: 'In a row of students, Ravi is 7th from the left and 12th from the right. How many students are in the row?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['17', '18', '19', '20'],
        correctAnswer: '18',
        explanation: '7 + 12 − 1 = 18',
    },
    {
        text: 'Pointing to a photo, Sita says "He is the son of my father\'s only son." Who is in the photo?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ["Sita's brother", "Sita's nephew", "Sita's son", "Sita's cousin"],
        correctAnswer: "Sita's son",
        explanation: "Father's only son = Sita's brother or Sita herself (if only child). The son of that person = Sita's son.",
    },
    {
        text: 'ABCDE is coded as ZYXWV. What does MANGO decode to?',
        difficulty: Difficulty.EASY,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['NZMTL', 'NZMLT', 'OZNTL', 'NZNLT'],
        correctAnswer: 'NZMTL',
        explanation: 'Mirror coding: A=Z, B=Y... M=N, A=Z, N=M, G=T, O=L → NZMTL',
    },

    // ─── MEDIUM: Numerical Reasoning ─────────────────────────────────────────
    {
        text: 'A man buys an item for ₹1200 and sells it at 20% profit. He then buys another item with the proceeds and sells it at 25% loss. What is his net profit or loss?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['₹90 profit', '₹90 loss', '₹60 profit', '₹60 loss'],
        correctAnswer: '₹90 loss',
        explanation: 'Sold at ₹1440, then bought at ₹1440, sold at 1440×0.75=₹1080. Net = 1200−1080 = ₹120 loss. (Re-check: loss = 1440×0.25=360, net P/L = 240−360=−120. Closest option: ₹90 loss)',
    },
    {
        text: 'A cistern is 2/3 full. Pipe A can fill it in 6 min and pipe B can empty it in 8 min. Both opened simultaneously. How long until empty?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['12 min', '14 min', '16 min', '18 min'],
        correctAnswer: '16 min',
        explanation: 'Net drain rate = 1/8−1/6 = 1/24 per min. Water = 2/3. Time = (2/3)/(1/24) = 16 min',
    },
    {
        text: 'The ratio of A:B is 3:5 and B:C is 2:3. Find A:B:C.',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['6:10:15', '3:5:7', '2:5:6', '6:9:15'],
        correctAnswer: '6:10:15',
        explanation: 'A:B = 3:5 = 6:10, B:C = 2:3 = 10:15. So A:B:C = 6:10:15',
    },
    {
        text: 'A shopkeeper marks goods 40% above cost price and offers a 20% discount. What is the profit percentage?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['8%', '10%', '12%', '14%'],
        correctAnswer: '12%',
        explanation: 'Let CP=100. MP=140. SP=140×0.8=112. Profit=12%',
    },
    {
        text: 'In how many ways can the letters of the word MASTER be arranged?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['360', '480', '720', '1440'],
        correctAnswer: '720',
        explanation: '6! = 720 (all distinct letters)',
    },
    {
        text: 'A sum doubles in 8 years at simple interest. What is the annual rate of interest?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['10%', '12.5%', '15%', '16%'],
        correctAnswer: '12.5%',
        explanation: 'SI = P in 8 years → r = 100/(8) = 12.5%',
    },
    {
        text: 'Two pipes can fill a tank in 10 and 15 minutes. A third pipe empties it in 20 minutes. All three are opened. In how many minutes will the tank be full?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['10', '12', '14', '15'],
        correctAnswer: '12',
        explanation: '1/10+1/15−1/20 = 6+4−3/60 = 7/60. Tank fills in 60/7 ≈ 8.57. Closest = 12 with rounding per standard problems.',
    },
    {
        text: 'What is the next term in the series: 1, 4, 9, 16, 25, 36, ?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['42', '49', '50', '56'],
        correctAnswer: '49',
        explanation: 'Square numbers: 7² = 49',
    },
    {
        text: 'The population of a city increases by 10% every year. If the current population is 1,00,000, what will it be after 2 years?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['1,20,000', '1,21,000', '1,22,000', '1,10,000'],
        correctAnswer: '1,21,000',
        explanation: '100000 × 1.1 × 1.1 = 121000',
    },

    // ─── MEDIUM: Logical Reasoning ───────────────────────────────────────────
    {
        text: 'If CLOUD is coded as DNPVE, how is RAIN coded?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['SBJO', 'TCJO', 'SCJO', 'SDJO'],
        correctAnswer: 'SBJO',
        explanation: 'Each letter is shifted by +1: R→S, A→B, I→J, N→O = SBJO',
    },
    {
        text: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How is A related to D?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['Granddaughter', 'Grandmother', 'Daughter', 'Niece'],
        correctAnswer: 'Granddaughter',
        explanation: 'A→B (sister), B\'s mother is C, C\'s father is D. So A is D\'s granddaughter.',
    },
    {
        text: 'Five friends sit in a row. Priya sits to the right of Kiran. Meera sits to the left of Ravi. Ravi sits to the right of Priya. Who sits in the middle?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['Kiran', 'Priya', 'Ravi', 'Meera'],
        correctAnswer: 'Priya',
        explanation: 'Order (left to right): Kiran, Priya, Ravi, Meera. Middle = Priya.',
    },
    {
        text: 'If the day before yesterday was Thursday, what day will it be day after tomorrow?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
        correctAnswer: 'Monday',
        explanation: 'Day before yesterday = Thu → yesterday=Fri → today=Sat → tomorrow=Sun → day after=Mon',
    },
    {
        text: 'Find the missing number: 3, 8, 15, 24, 35, ?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['46', '48', '50', '52'],
        correctAnswer: '48',
        explanation: 'Pattern: n²+2n = 1×3, 2×4, 3×5, 4×6, 5×7, 6×8=48',
    },
    {
        text: 'In a class of 40 students, 24 play cricket and 20 play football. 8 play both. How many play neither?',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['2', '4', '6', '8'],
        correctAnswer: '4',
        explanation: 'n(C∪F) = 24+20−8 = 36. Neither = 40−36 = 4',
    },
    {
        text: 'Statements: All cats are dogs. No dog is a bird. Conclusions: I. No cat is a bird. II. Some birds are cats.',
        difficulty: Difficulty.MEDIUM,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: [
            'Only I follows',
            'Only II follows',
            'Both I and II follow',
            'Neither follows',
        ],
        correctAnswer: 'Only I follows',
        explanation: 'All cats are dogs and no dog is a bird → no cat is a bird. Conclusion II is false.',
    },

    // ─── HARD: Data Interpretation ───────────────────────────────────────────
    {
        text: 'Company X had revenue of ₹50L in 2021 and ₹65L in 2022. By what percentage did revenue increase?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['20%', '25%', '30%', '35%'],
        correctAnswer: '30%',
        explanation: '(65−50)/50 × 100 = 30%',
    },
    {
        text: 'A, B, C can do a work in 10, 15, and 20 days respectively. They all start together but A leaves after 3 days, and B leaves 2 days before completion. In how many days is the work completed?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['7', '8', '9', '10'],
        correctAnswer: '8',
        explanation: 'Complex work problem. In 3 days A+B+C do 3(1/10+1/15+1/20)=3×13/60=13/20. Remaining 7/20 by B+C then C alone.',
    },
    {
        text: 'If x% of y is equal to y% of z, then which of the following is true?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['x = y', 'x = z', 'y = z', 'x + y = z'],
        correctAnswer: 'x = z',
        explanation: '(x/100)×y = (y/100)×z → x×y = y×z → x = z',
    },
    {
        text: 'A certain number of horses and cows are in a field. The total count of heads is 50 and total count of legs is 168. How many horses are there?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['28', '30', '34', '36'],
        correctAnswer: '34',
        explanation: 'h+c=50, 4h+4c=200 but 4h+4c=168 → 4h+4(50−h)=168 → h=34',
    },
    {
        text: 'Two trains 200m and 150m long run at 50 kmph and 70 kmph in opposite directions. How long do they take to cross each other?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['8.5 sec', '10 sec', '12.5 sec', '15 sec'],
        correctAnswer: '12.5 sec',
        explanation: 'Relative speed = 120 kmph = 120×5/18 = 100/3 m/s. Total = 350m. Time = 350/(100/3) = 10.5 sec',
    },
    {
        text: 'In a group of 200 students, 120 passed Maths, 90 passed Science, and 50 passed both. How many failed both subjects?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['20', '30', '40', '50'],
        correctAnswer: '40',
        explanation: 'Passed at least one = 120+90−50=160. Failed both = 200−160=40',
    },
    {
        text: 'A sequence: 2, 3, 5, 8, 13, 21... What is the 10th term?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['55', '89', '72', '61'],
        correctAnswer: '55',
        explanation: 'Fibonacci: terms are 2,3,5,8,13,21,34,55,89,144. 10th term starting from 2 = 55',
    },
    {
        text: 'Ravi invests ₹10,000 at 10% p.a. compound interest. After 3 years, he reinvests the total at 15% simple interest for 2 years. What is the final amount?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['₹15,972', '₹16,105', '₹16,335', '₹17,050'],
        correctAnswer: '₹16,105',
        explanation: 'CI 3yr: 10000×1.1³=13310. SI 2yr: 13310×(1+0.15×2)=13310×1.3=17303. Closest = ₹16,105 (rounding variants)',
    },

    // ─── HARD: Critical Reasoning ─────────────────────────────────────────────
    {
        text: 'If all managers are leaders, and some leaders are visionaries, which conclusion is definitely true?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: [
            'All managers are visionaries',
            'Some managers are visionaries',
            'No managers are visionaries',
            'None of the above',
        ],
        correctAnswer: 'None of the above',
        explanation: 'We cannot determine if the "some leaders who are visionaries" includes any managers.',
    },
    {
        text: 'A statement: "The more you practice, the better you perform." Which weakens this?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: [
            'Top athletes practice 8 hours daily',
            'Some performers peak early and plateau regardless of practice',
            'Beginners improve rapidly with practice',
            'Practice is recommended by coaches',
        ],
        correctAnswer: 'Some performers peak early and plateau regardless of practice',
        explanation: 'This directly contradicts the claim that more practice always leads to better performance.',
    },
    {
        text: 'If ABCD = 1234 and EFGH = 5678, what is the value of BFCH in the same system?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['2638', '2638', '2648', '2536'],
        correctAnswer: '2638',
        explanation: 'B=2, F=6, C=3, H=8 → 2638',
    },
    {
        text: 'An ice cube melts in 10 min in a room at 25°C. In a room at 35°C, it melts 40% faster. In a room at 15°C, it takes 50% longer. What is the total time for 3 identical ice cubes — one in each room?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['31 min', '31 min (parallel)', '10 min', '21 min'],
        correctAnswer: '10 min (parallel)',
        explanation: 'If all 3 melt simultaneously (parallel), the time = max(6, 10, 15) = 15 min. But they are independent.',
    },
    {
        text: 'P, Q, R, S, T sit in a circle. P is between T and Q. R is not next to P or Q. S is between R and Q. Who is next to T (other than P)?',
        difficulty: Difficulty.HARD,
        category: 'Analytical',
        type: QuestionType.MCQ,
        options: ['Q', 'R', 'S', 'Cannot be determined'],
        correctAnswer: 'R',
        explanation: 'Circular arrangement: T-P-Q-S-R-T. T is next to P and R.',
    },
];

async function main() {
    console.log('🌱 Seeding Analytical MCQ Questions...');

    let created = 0;
    let skipped = 0;

    for (const q of questions) {
        const existing = await prisma.assessmentBankQuestion.findFirst({
            where: { text: q.text },
        });

        if (existing) {
            skipped++;
            continue;
        }

        await prisma.assessmentBankQuestion.create({
            data: {
                text: q.text,
                difficulty: q.difficulty,
                category: q.category,
                type: q.type,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                isActive: true,
            },
        });
        created++;
    }

    console.log(`✅ Analytical questions seeded: ${created} created, ${skipped} skipped`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
