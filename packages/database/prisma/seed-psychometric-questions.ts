import { PrismaClient, Difficulty, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Psychometric MCQ Bank
 * Covers: Big Five Personality (OCEAN), Emotional Intelligence (EQ),
 * Situational Judgment, Work Style, Stress Tolerance, Values & Motivation.
 *
 * NOTE: Psychometric MCQs do not have "wrong" answers in real tests.
 * For scoring purposes in this platform, correctAnswer stores the
 * response that reflects the most professionally desirable trait.
 * The scoring service can apply weighted scoring per response.
 */

const questions = [
    // ─── EASY: Emotional Intelligence — Self-Awareness ───────────────────────
    {
        text: 'You are about to give a presentation when you suddenly feel very anxious. What do you do?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Acknowledge the anxiety, take a few deep breaths, and focus on your preparation',
            'Cancel the presentation and reschedule',
            'Push through while pretending you feel fine — do not let it show',
            'Ask a colleague to present on your behalf without explaining why',
        ],
        correctAnswer: 'Acknowledge the anxiety, take a few deep breaths, and focus on your preparation',
        explanation: 'High EQ involves recognising emotions without being overwhelmed by them (self-awareness + self-regulation).',
    },
    {
        text: 'After making a mistake at work, which thought pattern best reflects emotional maturity?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            '"I made a mistake. What can I learn from this and how do I fix it?"',
            '"I am terrible at my job and will probably get fired."',
            '"It does not matter — everyone makes mistakes."',
            '"Someone else contributed to this, so it is partly their fault too."',
        ],
        correctAnswer: '"I made a mistake. What can I learn from this and how do I fix it?"',
        explanation: 'Emotionally mature individuals apply a growth mindset — acknowledging errors without catastrophising or deflecting.',
    },
    {
        text: 'A colleague is visibly upset after receiving bad news at work. You:',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Check in privately and ask if there is anything you can do to support them',
            'Give them space and act as if nothing happened',
            'Try to cheer them up by making light of the situation',
            'Report to the manager that the colleague seems emotionally unstable',
        ],
        correctAnswer: 'Check in privately and ask if there is anything you can do to support them',
        explanation: 'Empathy — recognising and responding to others\' emotional states — is a core EQ competency.',
    },
    {
        text: 'When you are overwhelmed with work, how do you typically respond?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Pause, list all tasks by priority, and communicate capacity constraints to relevant stakeholders',
            'Work longer hours without telling anyone until you burn out',
            'Complain to colleagues about how unfair the workload is',
            'Stop responding to messages and hope the work reduces on its own',
        ],
        correctAnswer: 'Pause, list all tasks by priority, and communicate capacity constraints to relevant stakeholders',
        explanation: 'Self-regulation under stress combined with proactive communication reflects high EQ and professionalism.',
    },
    {
        text: 'Which statement best reflects a growth mindset?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            '"My abilities can improve with effort and the right strategies."',
            '"I am either naturally talented at something or I am not."',
            '"Failure means I am not suited for this role."',
            '"If I have to try hard, it means I am not smart enough."',
        ],
        correctAnswer: '"My abilities can improve with effort and the right strategies."',
        explanation: 'Growth mindset (Dweck, 2006) correlates with resilience, learning agility, and long-term performance.',
    },
    {
        text: 'In a heated argument with a colleague, you feel your temper rising. What is the best action?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Take a brief pause, calm yourself, and return to the conversation with a constructive tone',
            'Win the argument at all costs to establish authority',
            'Walk away permanently and avoid the colleague',
            'Raise your voice to signal that you are serious',
        ],
        correctAnswer: 'Take a brief pause, calm yourself, and return to the conversation with a constructive tone',
        explanation: 'Emotional self-regulation prevents escalation and models mature conflict resolution.',
    },

    // ─── EASY: Big Five — Conscientiousness & Agreeableness ──────────────────
    {
        text: 'When starting a new project, you typically:',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Break it into structured steps with timelines and milestones before starting',
            'Dive in immediately and figure things out as you go',
            'Wait for someone else to set the structure before contributing',
            'Discuss the project extensively without beginning work',
        ],
        correctAnswer: 'Break it into structured steps with timelines and milestones before starting',
        explanation: 'High conscientiousness — planning, organisation, and goal-directedness — is consistently linked to job performance.',
    },
    {
        text: 'A colleague presents an idea you think is flawed. How do you respond?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Acknowledge the effort, ask clarifying questions, and suggest improvements respectfully',
            'Point out all flaws immediately and directly to save time',
            'Stay quiet to avoid any conflict, even if the idea will cause problems',
            'Implement the idea as told and let the failure speak for itself',
        ],
        correctAnswer: 'Acknowledge the effort, ask clarifying questions, and suggest improvements respectfully',
        explanation: 'Agreeableness (cooperative, kind) balanced with openness allows for honest, respectful critique.',
    },
    {
        text: 'How do you prefer to receive feedback on your work?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Honest and specific — positive and negative — with suggestions for improvement',
            'Positive only — criticism is demotivating',
            'No feedback — I prefer to evaluate myself',
            'Only from people who are more senior than me',
        ],
        correctAnswer: 'Honest and specific — positive and negative — with suggestions for improvement',
        explanation: 'Openness to balanced feedback reflects psychological maturity and a desire for continuous improvement.',
    },

    // ─── EASY: Situational Judgment — Work Style ──────────────────────────────
    {
        text: 'You have two tasks due at the same time. One is for your manager; the other is a commitment you made to a peer. You:',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Communicate with both early, explain the situation, and agree a revised plan',
            'Do your manager\'s task and ignore the peer commitment',
            'Do the peer commitment since you promised them first',
            'Do both hurriedly, compromising quality on each',
        ],
        correctAnswer: 'Communicate with both early, explain the situation, and agree a revised plan',
        explanation: 'Integrity under pressure means honouring commitments OR renegotiating them honestly — not silently dropping them.',
    },
    {
        text: 'Which work environment do you find most motivating?',
        difficulty: Difficulty.EASY,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'One with clear goals, regular feedback, and opportunities to grow',
            'One with very little structure so I can be creative',
            'One where I do the same tasks daily with no surprises',
            'One where I work entirely alone without team dependency',
        ],
        correctAnswer: 'One with clear goals, regular feedback, and opportunities to grow',
        explanation: 'Motivation through purpose, mastery, and autonomy (Pink, 2009) aligns with high performance and retention.',
    },

    // ─── MEDIUM: Big Five — Openness & Extraversion ───────────────────────────
    {
        text: 'Your company introduces a new tool that replaces one you are very comfortable with. Your reaction is:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Approach it with curiosity, invest time in learning it, and share learnings with the team',
            'Resist the change and advocate for reverting to the old tool',
            'Use the new tool minimally and stick to old workarounds',
            'Complain that the change was unnecessary and disruptive',
        ],
        correctAnswer: 'Approach it with curiosity, invest time in learning it, and share learnings with the team',
        explanation: 'Openness to experience (Big Five) predicts adaptability in dynamic work environments.',
    },
    {
        text: 'You are introverted and have been asked to lead a large team meeting. You:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Prepare thoroughly, set a clear agenda, and leverage your listening skills to draw out others\' contributions',
            'Decline — you are not a natural leader',
            'Delegate the facilitation to an extroverted colleague',
            'Lead by talking as much as possible to compensate for introversion',
        ],
        correctAnswer: 'Prepare thoroughly, set a clear agenda, and leverage your listening skills to draw out others\' contributions',
        explanation: 'Effective leadership is not tied to extraversion. Introverts often lead with deeper preparation and listening — equally effective styles.',
    },
    {
        text: 'When working on a long, repetitive task, you tend to:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Find patterns to improve efficiency, set small milestones, and maintain quality throughout',
            'Rush through it to move on to more stimulating work',
            'Procrastinate until the deadline forces action',
            'Delegate it entirely even if you have capacity',
        ],
        correctAnswer: 'Find patterns to improve efficiency, set small milestones, and maintain quality throughout',
        explanation: 'Conscientiousness and persistence through routine tasks are strong predictors of reliability in professional settings.',
    },
    {
        text: 'You strongly disagree with a new company policy. The most appropriate response is:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Express disagreement through proper channels while complying professionally until a decision is made',
            'Openly undermine the policy among colleagues to build opposition',
            'Ignore the policy silently without voicing concerns',
            'Threaten to resign unless the policy is reversed',
        ],
        correctAnswer: 'Express disagreement through proper channels while complying professionally until a decision is made',
        explanation: 'Disagree and commit is a mature organisational behaviour — voice concerns constructively, then act in good faith.',
    },

    // ─── MEDIUM: EQ — Empathy & Social Skills ────────────────────────────────
    {
        text: 'During a group discussion, you notice a quieter colleague has been trying to speak but keeps getting interrupted. You:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Create space: "I think [name] was about to add something — let\'s hear their thoughts."',
            'Stay silent — it is their responsibility to be more assertive',
            'Interrupt loudly yourself to change the topic',
            'Mention it to the manager after the meeting',
        ],
        correctAnswer: 'Create space: "I think [name] was about to add something — let\'s hear their thoughts."',
        explanation: 'Social facilitation — actively creating space for others — reflects high interpersonal EQ.',
    },
    {
        text: 'A client is extremely frustrated and raises their voice during a call. You:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Stay calm, validate their frustration, and focus the conversation on resolution',
            'Match their energy to show you take the issue seriously',
            'Escalate immediately to your manager without addressing the client',
            'End the call — you do not need to tolerate aggression',
        ],
        correctAnswer: 'Stay calm, validate their frustration, and focus the conversation on resolution',
        explanation: 'De-escalation through empathy and composure is a hallmark of high EQ in customer-facing roles.',
    },
    {
        text: 'You suspect a teammate is taking credit for others\' ideas in meetings. The best response is:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Address it with the person privately first, focusing on specific instances',
            'Call it out publicly in the next meeting to make it stop',
            'Start doing the same to level the playing field',
            'Gossip about it with other colleagues to build awareness',
        ],
        correctAnswer: 'Address it with the person privately first, focusing on specific instances',
        explanation: 'Direct, private, fact-based confrontation is more effective and less damaging than public accusation.',
    },
    {
        text: 'You notice your own mood is negatively affecting your work interactions. You:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Acknowledge it internally, take a short break to reset, and apologise if you have been short with others',
            'Continue as normal — emotions are personal and should not affect work',
            'Blame the stressful situation for your behaviour',
            'Avoid all interactions for the rest of the day',
        ],
        correctAnswer: 'Acknowledge it internally, take a short break to reset, and apologise if you have been short with others',
        explanation: 'Emotional self-regulation with accountability (apologising if you have affected others) is a high EQ marker.',
    },

    // ─── MEDIUM: Stress Tolerance & Resilience ────────────────────────────────
    {
        text: 'You face three urgent deadlines in the same week. How do you manage?',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Triage by business impact, communicate constraints proactively, and deliver in priority order',
            'Work on all three simultaneously and deliver all of them late',
            'Focus on the easiest one first to build momentum',
            'Ask your manager to remove one deadline without proposing an alternative',
        ],
        correctAnswer: 'Triage by business impact, communicate constraints proactively, and deliver in priority order',
        explanation: 'Effective stress management involves prioritisation and transparent communication rather than silent overload.',
    },
    {
        text: 'After a project you led fails publicly, how do you recover?',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Conduct a retrospective, own your role in the failure, share learnings, and move forward constructively',
            'Avoid discussing the failure and focus on the next project immediately',
            'Extensively analyse what went wrong until you feel fully confident again',
            'Take an extended break before attempting leadership again',
        ],
        correctAnswer: 'Conduct a retrospective, own your role in the failure, share learnings, and move forward constructively',
        explanation: 'Resilience is not the absence of failure — it is the structured process of learning and rebuilding after it.',
    },
    {
        text: 'Which of the following best describes your approach to ambiguity at work?',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Clarify what I can, make reasonable assumptions for the rest, and document my reasoning',
            'Wait for complete information before taking any action',
            'Act immediately without seeking clarity — speed is more important',
            'Escalate any ambiguity to a senior person immediately',
        ],
        correctAnswer: 'Clarify what I can, make reasonable assumptions for the rest, and document my reasoning',
        explanation: 'Tolerance for ambiguity combined with structured decision-making is essential in modern, fast-moving workplaces.',
    },

    // ─── MEDIUM: Values & Motivation ─────────────────────────────────────────
    {
        text: 'Which factor would most motivate you to stay at a company long-term?',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Clear growth opportunities, meaningful work, and a strong team culture',
            'The highest salary in the market regardless of other factors',
            'A role with minimal responsibility and low stress',
            'Proximity to home and flexible working hours above all else',
        ],
        correctAnswer: 'Clear growth opportunities, meaningful work, and a strong team culture',
        explanation: 'Intrinsic motivation (purpose, mastery, belonging) predicts long-term engagement more reliably than extrinsic factors alone.',
    },
    {
        text: 'You are offered a higher-paying role that aligns poorly with your values. You:',
        difficulty: Difficulty.MEDIUM,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Carefully weigh long-term satisfaction vs. short-term financial gain before deciding',
            'Accept immediately — salary is the most important factor',
            'Decline immediately — values are non-negotiable',
            'Accept but plan to change the company culture from within',
        ],
        correctAnswer: 'Carefully weigh long-term satisfaction vs. short-term financial gain before deciding',
        explanation: 'Values-aligned decision making requires nuance — not blind financial pursuit or dogmatic values absolutism.',
    },

    // ─── HARD: Advanced EQ — Neuroticism & Impulse Control ────────────────────
    {
        text: 'You receive critical public feedback from a senior executive in a meeting with 30 people. Your instinctive reaction is anger. What do you actually do?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Breathe, listen fully, acknowledge the feedback calmly, and ask a clarifying question to show engagement',
            'Respond immediately to defend your position while emotions are high',
            'Stay completely silent, show no reaction, and address it privately afterward without acknowledging it in the meeting',
            'Excuse yourself from the meeting temporarily to compose yourself',
        ],
        correctAnswer: 'Breathe, listen fully, acknowledge the feedback calmly, and ask a clarifying question to show engagement',
        explanation: 'High EQ under public pressure means processing the emotion internally while maintaining a professional exterior — and demonstrating genuine engagement.',
    },
    {
        text: 'You have just been passed over for a promotion in favour of a colleague you mentored. Which response demonstrates the highest EQ?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Congratulate your colleague sincerely, then schedule a private conversation with your manager to understand what to develop for future opportunities',
            'Withdraw your mentoring support since it clearly did not benefit you',
            'Congratulate them outwardly but begin looking for a new role immediately',
            'Ask HR to review the decision formally',
        ],
        correctAnswer: 'Congratulate your colleague sincerely, then schedule a private conversation with your manager to understand what to develop for future opportunities',
        explanation: 'Genuine generosity combined with self-advocacy — without bitterness — reflects elite-level emotional intelligence.',
    },
    {
        text: 'You are managing a team member who is technically brilliant but consistently undermines team morale through negative comments. How do you handle this?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Have a private, structured conversation with specific examples, acknowledge their strengths, and set clear behavioural expectations with follow-up',
            'Ignore the behaviour to preserve their technical contributions',
            'Issue a formal warning immediately to make clear the behaviour is serious',
            'Let the team address it through peer pressure',
        ],
        correctAnswer: 'Have a private, structured conversation with specific examples, acknowledge their strengths, and set clear behavioural expectations with follow-up',
        explanation: 'Effective people management requires balancing performance preservation with clear behavioural accountability.',
    },
    {
        text: 'A project you championed for months is cancelled by senior leadership with minimal explanation. You feel undervalued. What do you do?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Process your disappointment, seek context from your manager, and pivot energy to the next priority constructively',
            'Disengage from work quietly for a period as a self-protective response',
            'Push back aggressively in meetings to reverse the decision',
            'Use the experience as evidence that leadership does not value your input, and begin job hunting',
        ],
        correctAnswer: 'Process your disappointment, seek context from your manager, and pivot energy to the next priority constructively',
        explanation: 'Psychological resilience means allowing yourself to feel disappointment without letting it drive destructive behaviour or cynicism.',
    },

    // ─── HARD: Advanced Situational Judgment ─────────────────────────────────
    {
        text: 'You discover that your team\'s strong performance metrics are partly the result of data being selectively reported by a well-regarded manager. What do you do?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Raise it with the manager directly first; if unresolved, escalate through appropriate channels with documentation',
            'Report it anonymously and wait to see what happens',
            'Stay silent to protect team morale and the manager\'s reputation',
            'Correct the data yourself without informing anyone',
        ],
        correctAnswer: 'Raise it with the manager directly first; if unresolved, escalate through appropriate channels with documentation',
        explanation: 'Integrity requires addressing data integrity issues even when politically uncomfortable. Escalation is appropriate when direct conversation fails.',
    },
    {
        text: 'You are tasked with giving a performance review to a close friend on your team. They expect a high rating, but their performance has been below standard. You:',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Deliver an honest review with specific evidence, empathy, and a clear development plan regardless of the friendship',
            'Inflate the rating to preserve the friendship and deal with performance issues informally',
            'Recuse yourself from the review and ask HR to assign another manager',
            'Give an honest review but allow them to see it before it is submitted to soften the impact',
        ],
        correctAnswer: 'Deliver an honest review with specific evidence, empathy, and a clear development plan regardless of the friendship',
        explanation: 'Integrity in performance management overrides personal relationships. A true friend benefits more from honest feedback than inflated ratings.',
    },
    {
        text: 'Your team consistently meets targets only by cutting corners on quality. Leadership celebrates the results. How do you respond?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Raise the quality issue with data on long-term risk (technical debt, customer churn) even while the team is being celebrated',
            'Continue the pattern — if leadership is happy, it must be acceptable',
            'Fix quality issues yourself after hours without flagging the root cause',
            'Wait for a visible quality failure before raising the issue',
        ],
        correctAnswer: 'Raise the quality issue with data on long-term risk (technical debt, customer churn) even while the team is being celebrated',
        explanation: 'Moral courage means raising difficult truths even in positive climates. Short-term wins built on quality compromises carry hidden long-term costs.',
    },
    {
        text: 'You are promoted to manage a team that previously reported to your closest colleague, who also applied for the role. They are now your direct report. How do you navigate this?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Have a direct, empathetic conversation early, acknowledge the awkwardness, set clear professional boundaries, and focus on supporting their growth',
            'Avoid the topic entirely and let things settle naturally over time',
            'Distance yourself professionally to eliminate any perception of favouritism',
            'Treat them exactly the same as before — nothing has changed personally',
        ],
        correctAnswer: 'Have a direct, empathetic conversation early, acknowledge the awkwardness, set clear professional boundaries, and focus on supporting their growth',
        explanation: 'Navigating relational complexity in leadership transitions requires emotional honesty and explicit expectation-setting — not avoidance.',
    },

    // ─── HARD: Big Five — Neuroticism & Stability ────────────────────────────
    {
        text: 'In high-pressure situations, which trait best predicts your ability to make sound decisions?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Emotional stability — the ability to remain calm and objective under stress',
            'Extraversion — communicating confidently in crisis draws others to follow',
            'Conscientiousness — having pre-planned processes for all scenarios',
            'Openness — creativity generates novel solutions under pressure',
        ],
        correctAnswer: 'Emotional stability — the ability to remain calm and objective under stress',
        explanation: 'Research consistently shows emotional stability (low neuroticism) is the strongest Big Five predictor of performance under pressure.',
    },
    {
        text: 'You have a pattern of second-guessing decisions after they are made, even when the outcome is positive. This tendency most likely reflects:',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'High neuroticism, which can be managed through structured reflection and self-compassion practices',
            'High conscientiousness — you care deeply about doing things correctly',
            'High openness — you are exploring alternative possibilities',
            'Low agreeableness — you are uncomfortable with decisions affecting others',
        ],
        correctAnswer: 'High neuroticism, which can be managed through structured reflection and self-compassion practices',
        explanation: 'Post-decision rumination even after positive outcomes is characteristic of high neuroticism. Recognising this allows targeted self-management strategies.',
    },
    {
        text: 'You observe that your emotional responses to workplace events are significantly stronger than those of your peers. The most effective strategy is:',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'Develop structured emotional regulation habits (journaling, mindfulness, delay-response rules) and seek feedback on impact',
            'Suppress emotions entirely in professional settings',
            'Embrace intensity as a strength — passion drives performance',
            'Avoid roles or situations that trigger strong emotional responses',
        ],
        correctAnswer: 'Develop structured emotional regulation habits (journaling, mindfulness, delay-response rules) and seek feedback on impact',
        explanation: 'Emotional intensity can be channelled productively with the right regulatory tools — suppression and avoidance are less effective long-term.',
    },
    {
        text: 'Which of the following scenarios requires the MOST psychological safety to resolve effectively?',
        difficulty: Difficulty.HARD,
        category: 'Psychometric',
        type: QuestionType.MCQ,
        options: [
            'A junior employee admitting to a significant error that affected a client',
            'A manager giving positive feedback in a public forum',
            'A team agreeing on which of two good options to choose',
            'An employee requesting a day off',
        ],
        correctAnswer: 'A junior employee admitting to a significant error that affected a client',
        explanation: 'Psychological safety (Edmondson) is most needed when vulnerability and potential negative consequences are highest — as in admitting consequential errors upward.',
    },
];

async function main() {
    console.log('🌱 Seeding Psychometric MCQ Questions...');

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

    console.log(`✅ Psychometric questions seeded: ${created} created, ${skipped} skipped`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
