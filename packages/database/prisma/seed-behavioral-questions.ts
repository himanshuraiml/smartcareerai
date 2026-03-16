import { PrismaClient, Difficulty, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
    // ─── EASY: Self-Awareness & Communication ────────────────────────────────
    {
        text: 'When you receive critical feedback from your manager, what is the most professional response?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Thank them, ask clarifying questions, and create an action plan',
            'Defend your work and explain why you were right',
            'Stay silent and hope the issue is forgotten',
            'Immediately agree with everything to avoid conflict',
        ],
        correctAnswer: 'Thank them, ask clarifying questions, and create an action plan',
        explanation: 'Constructive feedback is an opportunity to grow. Acknowledging it, seeking clarity, and planning improvement shows maturity and professionalism.',
    },
    {
        text: 'A colleague is struggling with a task that you have already completed. What do you do?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Offer to help and guide them through the problem',
            'Do the work for them so it gets done quickly',
            'Ignore it — it\'s not your responsibility',
            'Tell your manager so the colleague gets noticed',
        ],
        correctAnswer: 'Offer to help and guide them through the problem',
        explanation: 'Guiding rather than doing for them builds the colleague\'s skills and fosters a collaborative work environment.',
    },
    {
        text: 'You are assigned a task with a tight deadline and realize mid-way it will take longer than expected. What is the best course of action?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Inform your manager early and discuss options to adjust scope or deadline',
            'Keep working overtime without telling anyone',
            'Submit an incomplete version on time',
            'Ask a colleague to finish it without informing your manager',
        ],
        correctAnswer: 'Inform your manager early and discuss options to adjust scope or deadline',
        explanation: 'Proactive communication about obstacles allows managers to reprioritize resources and set realistic expectations.',
    },
    {
        text: 'Which of the following best describes active listening?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Focusing fully on the speaker, asking clarifying questions, and summarizing what was said',
            'Nodding along while mentally planning your response',
            'Interrupting to share your own related experience',
            'Listening only to the parts that are relevant to you',
        ],
        correctAnswer: 'Focusing fully on the speaker, asking clarifying questions, and summarizing what was said',
        explanation: 'Active listening involves full attention, empathy, and confirming understanding — not passive hearing.',
    },
    {
        text: 'You disagree with a decision made by your team lead. What is the most appropriate action?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Respectfully raise your concerns privately with data to support your view',
            'Complain to other team members to build opposition',
            'Refuse to execute the decision',
            'Accept it silently and do a poor job on purpose',
        ],
        correctAnswer: 'Respectfully raise your concerns privately with data to support your view',
        explanation: 'Professional disagreement should be expressed through proper channels with evidence, not passive resistance or gossip.',
    },
    {
        text: 'What does "taking ownership" in a workplace primarily mean?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Accepting responsibility for both successes and failures of your work',
            'Taking credit for a team achievement',
            'Volunteering for the highest-visibility projects only',
            'Doing whatever it takes to avoid blame',
        ],
        correctAnswer: 'Accepting responsibility for both successes and failures of your work',
        explanation: 'Ownership means being accountable end-to-end, including learning from mistakes without deflecting blame.',
    },
    {
        text: 'During a team meeting, one person dominates the conversation. As a peer, what should you do?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Politely redirect: "That\'s a great point — I\'d love to hear others\' thoughts too"',
            'Interrupt them loudly to make your point',
            'Stay silent and let the meeting run its course',
            'Leave the meeting early in protest',
        ],
        correctAnswer: 'Politely redirect: "That\'s a great point — I\'d love to hear others\' thoughts too"',
        explanation: 'Inclusive facilitation ensures all voices are heard without shaming anyone.',
    },
    {
        text: 'You are asked to do a task that is outside your job description but within your capabilities. You should:',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Help if it does not significantly impact your core responsibilities',
            'Refuse because it is not in your contract',
            'Agree but intentionally do it poorly',
            'Ask for a pay raise before agreeing',
        ],
        correctAnswer: 'Help if it does not significantly impact your core responsibilities',
        explanation: 'Flexibility and willingness to go beyond your defined role are hallmarks of a high-potential employee.',
    },
    {
        text: 'How should you handle a situation where two team members are in conflict?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Encourage direct communication between them and offer to mediate if needed',
            'Take sides with the person you are closer to',
            'Report it immediately to HR without speaking to either party',
            'Ignore it and hope it resolves itself',
        ],
        correctAnswer: 'Encourage direct communication between them and offer to mediate if needed',
        explanation: 'Conflicts resolved through direct, respectful dialogue are more sustainable than those escalated prematurely.',
    },
    {
        text: 'What is the primary purpose of setting SMART goals at work?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'To create clear, measurable targets that guide focus and measure progress',
            'To impress managers during appraisals',
            'To make work look more complex than it is',
            'To avoid being assigned additional responsibilities',
        ],
        correctAnswer: 'To create clear, measurable targets that guide focus and measure progress',
        explanation: 'SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) provide structure and accountability.',
    },

    // ─── EASY: Work Ethic & Integrity ────────────────────────────────────────
    {
        text: 'You accidentally send an incorrect report to a client. What do you do first?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Inform your manager immediately and send a correction to the client with an apology',
            'Wait to see if the client notices before acting',
            'Send the correct report without acknowledging the error',
            'Blame a colleague for the mistake',
        ],
        correctAnswer: 'Inform your manager immediately and send a correction to the client with an apology',
        explanation: 'Transparency in mistakes preserves trust. Hiding errors erodes credibility when discovered later.',
    },
    {
        text: 'A colleague asks you to sign off on work you have not reviewed. You should:',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Review the work properly before signing, or decline if you cannot',
            'Sign it to avoid conflict — they are your friend',
            'Sign it but add a disclaimer that you did not review it',
            'Report the colleague to HR immediately',
        ],
        correctAnswer: 'Review the work properly before signing, or decline if you cannot',
        explanation: 'Your signature represents your endorsement. Signing without review compromises your integrity and accountability.',
    },
    {
        text: 'You notice a small but repeated compliance violation by a senior colleague. What should you do?',
        difficulty: Difficulty.EASY,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Raise it through the appropriate internal channel (manager or compliance team)',
            'Ignore it because they are senior',
            'Post about it on social media to create accountability',
            'Join in since everyone else seems to be doing it',
        ],
        correctAnswer: 'Raise it through the appropriate internal channel (manager or compliance team)',
        explanation: 'Ethics does not change based on seniority. Proper channels exist to handle such situations constructively.',
    },

    // ─── MEDIUM: Teamwork & Collaboration ────────────────────────────────────
    {
        text: 'Your team misses a project deadline. During the retrospective, most members blame one person. As the team lead, how do you respond?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Redirect focus to systemic issues and shared accountability, then create a process improvement plan',
            'Agree with the team and formally reprimand the individual',
            'Defend the individual without addressing what went wrong',
            'Cancel the retrospective to avoid negative emotions',
        ],
        correctAnswer: 'Redirect focus to systemic issues and shared accountability, then create a process improvement plan',
        explanation: 'Effective leaders move beyond blame to root causes. Team failures are rarely one person\'s fault — process gaps usually exist.',
    },
    {
        text: 'You are working on a high-priority project when a colleague asks for urgent help on theirs. How do you prioritize?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Assess urgency of both tasks, communicate with your manager if needed, and offer limited help',
            'Drop your project entirely to help your colleague',
            'Refuse any help and focus only on your task',
            'Ask your manager to reassign the colleague\'s task to someone else',
        ],
        correctAnswer: 'Assess urgency of both tasks, communicate with your manager if needed, and offer limited help',
        explanation: 'Balancing competing priorities requires judgment. Communicating tradeoffs transparently is key.',
    },
    {
        text: 'A new team member is struggling to integrate. What is the most effective approach?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Proactively introduce them, explain team norms, and include them in discussions',
            'Give them time — they will figure it out on their own',
            'Report to the manager that they are underperforming',
            'Assign them the least important tasks until they prove themselves',
        ],
        correctAnswer: 'Proactively introduce them, explain team norms, and include them in discussions',
        explanation: 'Onboarding support dramatically reduces ramp-up time and improves long-term retention and performance.',
    },
    {
        text: 'Two departments have conflicting priorities for a shared resource. You are managing the resource. What is the best approach?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Facilitate a discussion with both department heads, align on business priority, and document the decision',
            'Give priority to the department that asked first',
            'Divide the resource equally regardless of business impact',
            'Escalate to the CEO immediately',
        ],
        correctAnswer: 'Facilitate a discussion with both department heads, align on business priority, and document the decision',
        explanation: 'Resource conflicts are best resolved by surfacing competing priorities to decision-makers and using strategic business value to guide allocation.',
    },
    {
        text: 'Your team has a diverse set of opinions on how to solve a problem. Which approach best leads to a good outcome?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Structure a session to evaluate each option objectively against defined criteria',
            'Go with the majority vote even if the logic is weak',
            'Implement the senior person\'s idea without debate',
            'Avoid the discussion and let each person do it their own way',
        ],
        correctAnswer: 'Structure a session to evaluate each option objectively against defined criteria',
        explanation: 'Structured decision-making reduces bias and ensures the best idea wins, not the loudest voice.',
    },

    // ─── MEDIUM: Adaptability & Resilience ───────────────────────────────────
    {
        text: 'Your company announces a major restructuring that changes your role significantly. How do you react?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Seek to understand the rationale, identify growth opportunities, and ask your manager how to contribute best',
            'Immediately update your CV and begin job hunting',
            'Resist the change by slowing down deliverables',
            'Complain to colleagues and create anxiety in the team',
        ],
        correctAnswer: 'Seek to understand the rationale, identify growth opportunities, and ask your manager how to contribute best',
        explanation: 'Adaptability is a top employability trait. Leaders look for people who embrace change and help others navigate it.',
    },
    {
        text: 'You have been working on a project for weeks when leadership decides to pivot direction. Your work becomes irrelevant. What is your response?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Accept the pivot, document learnings, and redirect energy to the new direction',
            'Express frustration openly in team meetings',
            'Continue working on the original direction hoping leadership will reverse',
            'Demand recognition for the work done before pivoting',
        ],
        correctAnswer: 'Accept the pivot, document learnings, and redirect energy to the new direction',
        explanation: 'Sunk-cost thinking is a cognitive trap. Resilient professionals extract learnings and move forward efficiently.',
    },
    {
        text: 'You failed to meet a performance target for the second consecutive quarter. What is the most productive response?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Conduct a personal root cause analysis, seek feedback, and develop a concrete improvement plan',
            'Attribute the failure to external factors beyond your control',
            'Set lower targets to make them easier to achieve next quarter',
            'Wait and see if performance improves on its own',
        ],
        correctAnswer: 'Conduct a personal root cause analysis, seek feedback, and develop a concrete improvement plan',
        explanation: 'Continuous improvement requires honest self-assessment and targeted action, not blame or avoidance.',
    },
    {
        text: 'You receive conflicting instructions from two managers on the same project. What do you do?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Clarify by bringing both managers together to align on the priority',
            'Follow the instruction of the more senior manager',
            'Flip a coin and pick one',
            'Do nothing until they resolve the conflict themselves',
        ],
        correctAnswer: 'Clarify by bringing both managers together to align on the priority',
        explanation: 'Ambiguity in direction should be resolved by bringing stakeholders to alignment — not by unilateral decisions.',
    },

    // ─── MEDIUM: Initiative & Leadership ─────────────────────────────────────
    {
        text: 'You identify a recurring inefficiency in your team\'s process, but no one has asked you to fix it. What do you do?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Document the problem, propose a solution to your manager, and offer to lead the fix',
            'Wait until someone officially assigns the problem to you',
            'Fix it yourself without telling anyone to avoid scrutiny',
            'Raise it in every meeting until someone else takes it up',
        ],
        correctAnswer: 'Document the problem, propose a solution to your manager, and offer to lead the fix',
        explanation: 'Proactive problem-solving with structured proposals is the mark of high initiative and leadership potential.',
    },
    {
        text: 'You are the most experienced person in a team of juniors on a critical project. Your role is:',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Coach and delegate — build their capability while ensuring quality outcomes',
            'Do all the important work yourself to guarantee success',
            'Let them lead without any guidance since they need to learn',
            'Document everything in detail so you are not blamed if it fails',
        ],
        correctAnswer: 'Coach and delegate — build their capability while ensuring quality outcomes',
        explanation: 'True leadership multiplies the capabilities of those around you, not just your own output.',
    },
    {
        text: 'A customer escalates a complaint to your team. You were not involved in the issue. What do you do?',
        difficulty: Difficulty.MEDIUM,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Acknowledge the concern, gather facts, and coordinate a resolution even if it\'s not your fault',
            'Redirect the customer to the person directly responsible',
            'Apologize profusely without understanding the actual problem',
            'Avoid the customer until the responsible colleague is available',
        ],
        correctAnswer: 'Acknowledge the concern, gather facts, and coordinate a resolution even if it\'s not your fault',
        explanation: 'Customer-centric behavior means owning the experience regardless of internal responsibility boundaries.',
    },

    // ─── HARD: Ethical Dilemmas & Complex Judgment ───────────────────────────
    {
        text: 'You discover that a popular team member is falsifying their timesheets by a small amount. What is the right course of action?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Speak to them privately first, then escalate if it continues — document everything',
            'Report them to HR immediately without any prior conversation',
            'Ignore it since the amount is small and they are well-liked',
            'Confront them publicly to deter others from doing the same',
        ],
        correctAnswer: 'Speak to them privately first, then escalate if it continues — document everything',
        explanation: 'Ethical action balances integrity with fairness. A private conversation allows for course correction; escalation becomes necessary if it persists.',
    },
    {
        text: 'Your manager asks you to present data in a way that is technically accurate but deliberately misleading to a client. You should:',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Push back professionally and propose a more transparent presentation that still protects business interests',
            'Comply — your manager knows best and it\'s not your decision',
            'Refuse outright and immediately escalate to senior leadership',
            'Present it as asked but add a disclaimer that makes the manipulation obvious',
        ],
        correctAnswer: 'Push back professionally and propose a more transparent presentation that still protects business interests',
        explanation: 'Misleading clients damages trust and reputation long-term. Ethical employees push back constructively with alternatives.',
    },
    {
        text: 'You are in the final round of interviews for a role. The interviewer asks for confidential information from your current employer. What do you do?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Politely decline and explain that sharing confidential information would be a breach of trust',
            'Share it — you are leaving the company anyway',
            'Provide general information without specific confidential data',
            'Ask the interviewer to sign a non-disclosure before you share',
        ],
        correctAnswer: 'Politely decline and explain that sharing confidential information would be a breach of trust',
        explanation: 'A company that asks you to breach your current employer\'s trust will likely expect the same from you. Integrity is non-negotiable.',
    },
    {
        text: 'You are under significant pressure to close a deal. The client seems confused about a key limitation of your product. You should:',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Proactively clarify the limitation — a client who buys with wrong expectations will churn and damage your reputation',
            'Let them remain confused — they will figure it out after purchase',
            'Emphasize benefits heavily to distract from the limitation',
            'Close the deal quickly before they ask about it',
        ],
        correctAnswer: 'Proactively clarify the limitation — a client who buys with wrong expectations will churn and damage your reputation',
        explanation: 'Honest selling builds long-term relationships. Short-term wins from deception lead to churn, refunds, and reputational damage.',
    },
    {
        text: 'Your project is critically behind. You can either: (A) work over the weekend without pay to catch up, or (B) tell the client the deadline must shift. Which is more appropriate and why?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            '(B) — transparent communication with clients builds long-term trust more than silent heroics that set unrealistic precedents',
            '(A) — always protect client commitments at personal cost',
            '(A) — it shows dedication and distinguishes you from peers',
            '(B) — always protect your own time regardless of impact on the business',
        ],
        correctAnswer: '(B) — transparent communication with clients builds long-term trust more than silent heroics that set unrealistic precedents',
        explanation: 'Sustainable performance requires honest communication. Chronic overextension creates burnout and false expectations.',
    },

    // ─── HARD: Leadership Under Pressure ─────────────────────────────────────
    {
        text: 'As a team lead, one of your top performers starts underperforming due to a personal crisis. What is the best approach?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Have a private, empathetic conversation, offer flexible arrangements, and set clear (but compassionate) performance expectations',
            'Formally put them on a performance improvement plan immediately',
            'Reassign all their work to protect project outcomes without any conversation',
            'Let the situation resolve itself without interfering in personal matters',
        ],
        correctAnswer: 'Have a private, empathetic conversation, offer flexible arrangements, and set clear (but compassionate) performance expectations',
        explanation: 'Leadership requires balancing business needs with human empathy. Ignoring either leads to poor outcomes.',
    },
    {
        text: 'Your team is burnt out after a major release. Leadership is already pushing for the next sprint. As the manager, what do you do?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Advocate to leadership for a brief recovery period, presenting the productivity and quality risks of pushing immediately',
            'Pass the pressure directly to the team without filtering it',
            'Commit to leadership\'s timeline without telling the team how burnt out they are',
            'Tell the team to push through — deadlines are non-negotiable',
        ],
        correctAnswer: 'Advocate to leadership for a brief recovery period, presenting the productivity and quality risks of pushing immediately',
        explanation: 'A manager\'s job includes buffering the team from unsustainable pressure and advocating for conditions that enable quality work.',
    },
    {
        text: 'You are leading a cross-functional initiative. Two influential stakeholders have publicly opposing views on the approach. How do you proceed?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Meet each stakeholder separately to understand their core concern, then find a synthesis in a joint session',
            'Side with the more senior stakeholder to move forward quickly',
            'Put it to a vote among the wider team',
            'Delay the project until the stakeholders resolve it themselves',
        ],
        correctAnswer: 'Meet each stakeholder separately to understand their core concern, then find a synthesis in a joint session',
        explanation: 'Effective leaders use back-channel alignment to understand real concerns before attempting public synthesis — it reduces defensiveness.',
    },
    {
        text: 'You are in a high-stakes presentation when you realize mid-way that a key assumption in your analysis is wrong. What do you do?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Acknowledge the error immediately, explain the impact, and commit to a revised analysis with a timeline',
            'Continue the presentation and fix it quietly afterwards',
            'Blame the data source to redirect responsibility',
            'Stop the presentation and reschedule without explanation',
        ],
        correctAnswer: 'Acknowledge the error immediately, explain the impact, and commit to a revised analysis with a timeline',
        explanation: 'Transparency under pressure builds credibility. Covering up errors in high-stakes settings always makes things worse when discovered.',
    },
    {
        text: 'During a hiring decision, you notice that the top-rated candidate is from a similar background to most of the panel. You suspect bias. What do you do?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Raise the concern objectively with the panel, propose reviewing each candidate against predefined criteria rather than gut feel',
            'Stay silent — questioning colleagues\' judgment creates conflict',
            'Advocate for a different candidate based purely on diversity without revisiting criteria',
            'Accept the outcome — bias is difficult to prove',
        ],
        correctAnswer: 'Raise the concern objectively with the panel, propose reviewing each candidate against predefined criteria rather than gut feel',
        explanation: 'Inclusion requires active intervention. Raising the concern with a process solution (criteria review) is more actionable than abstract accusations.',
    },
    {
        text: 'You are asked to take credit publicly for a project that was largely executed by a junior team member. What do you do?',
        difficulty: Difficulty.HARD,
        category: 'Behavioral',
        type: QuestionType.MCQ,
        options: [
            'Correct the record publicly, explicitly attribute the work to the team member, and advocate for their recognition',
            'Accept the credit — you were responsible for the project anyway',
            'Share the credit vaguely without naming the junior member specifically',
            'Talk to the junior member privately but accept the credit publicly',
        ],
        correctAnswer: 'Correct the record publicly, explicitly attribute the work to the team member, and advocate for their recognition',
        explanation: 'Publicly attributing credit to those who earned it is a hallmark of trusted leadership and accelerates team morale and loyalty.',
    },
];

async function main() {
    console.log('🌱 Seeding Behavioral MCQ Questions...');

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

    console.log(`✅ Behavioral questions seeded: ${created} created, ${skipped} skipped`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
