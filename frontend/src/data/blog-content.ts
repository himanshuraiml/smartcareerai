export interface BlogPost {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    readTime: string;
    date: string;
    content: string;
    image: string;
    featured: boolean;
    keywords: string[];
}

export const CATEGORIES = ["All", "Resume Tips", "Interview Prep", "Career Guide", "Soft Skills", "Networking"];

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 1,
        slug: "10-resume-mistakes-that-are-killing-your-applications",
        title: "10 Resume Mistakes That Are Killing Your Applications",
        excerpt: "Are you struggling to get interview calls despite applying to hundreds of jobs? Your resume might contain common mistakes that Applicant Tracking Systems (ATS) and recruiters flag instantly. Learn the top 10 resume errors and how to fix them to pass the ATS filter and land your dream job.",
        category: "Resume Tips",
        readTime: "7 min read",
        date: "Feb 5, 2026",
        image: "/blog/resume-mistakes.jpg", // Placeholder
        featured: true,
        keywords: ["resume mistakes", "ATS optimization", "CV tips", "job application", "resume format", "resume errors", "ATS score", "recruiters", "job search"],
        content: `
## Why Your Resume Isn't Getting Selected

In today's competitive job market, getting your resume noticed is harder than ever. Companies use advanced Applicant Tracking Systems (ATS) to filter out candidates before a human even sees your application. If your resume contains these common mistakes, you're likely being rejected automatically.

Here are the 10 most critical resume mistakes you must avoid in 2026:

### 1. Using Creative Columns and Graphics
While a visually stunning resume might look great to you, ATS software struggles to parse complex layouts. Stick to a clean, single-column format to ensure your information is read correctly.
**Fix:** prioritize readability and standard formatting over flashy design elements.

### 2. Including a Photo
Unless you are applying for a modeling or acting role, including a photo can lead to bias and discrimination concerns. Many companies automatically discard resumes with photos to avoid legal issues.
**Fix:** Remove your headshot. Let your skills and experience speak for themselves.

### 3. Generic "Objective" Statements
Old-school objectives like "Seeking a challenging position to utilize my skills" are outdated and vague. Recruiters want to know what value *you* bring to *them*.
**Fix:** replace your objective with a powerful "Professional Summary" that highlights your key achievements and career trajectory.

### 4. Ignoring Keywords form the Job Description
ATS scanners look for specific keywords related to the job description. If your resume doesn't mimic the language of the job posting, you won't rank high enough to satisfy the algorithm.
**Fix:** Tailor your resume for every application. Use tools like **PlaceNxt's AI Resume Scorer** to identify missing keywords.

### 5. Listing Duties Instead of Achievements
Don't just list what you were responsible for; show what you accomplished. "Responsible for sales" is weak. "Increased sales revenue by 20% in Q3" is improved.
**Fix:** Use action verbs and quantify your results with numbers, percentages, and dollar amounts.

### 6. Typographical and Grammatical Errors
Detail-oriented is a common requirement. A typo in your resume suggests you lack attention to detail.
**Fix:** Proofread multiple times. Use Grammarly or have a friend review it.

### 7. Unprofessional Email Addresses
Using an email like \`cool_dude_99@hotmail.com\` looks unprofessional.
**Fix:** Create a dedicated professional email address, ideally format \`firstname.lastname@gmail.com\`.

### 8. Including Irrelevant Information
Hobbies, marital status, or primary school grades clutter your resume and distract from your professional qualifications.
**Fix:** Keep it relevant. If it doesn't prove you can do the job, cut it.

### 9. Incorrect File Format
Sending a Word document can result in formatting errors on the recruiter's screen.
**Fix:** Always save and submit your resume as a **PDF**, unless the application specifically requests a Word doc.

### 10. Making it Too Long
Recruiters spend an average of 7 seconds scanning a resume. If it's 3-4 pages long, they won't find the important stuff.
**Fix:** Keep it to 1 page for less than 10 years of experience, and strictly 2 pages for senior roles.

## Conclusion
Your resume is your ticket to the interview. By avoiding these common pitfalls and optimizing for both ATS and human readers, you significantly increase your chances of success. Use **PlaceNxt's AI Resume Analyzer** today to get a free comprehensive score and actionable feedback!
        `
    },
    {
        id: 2,
        slug: "how-to-ace-your-first-technical-interview",
        title: "How to Ace Your First Technical Interview",
        excerpt: "Nervous about your upcoming coding interview? Don't panic. Our comprehensive guide covers everything from mastering Data Structures and Algorithms (DSA) to nailing the system design round. Get ready to impress your interviewers.",
        category: "Interview Prep",
        readTime: "9 min read",
        date: "Feb 2, 2026",
        image: "/blog/tech-interview.jpg",
        featured: false,
        keywords: ["technical interview", "coding interview", "data structures", "algorithms", "system design", "software engineer", "interview tips", "faang interview"],
        content: `
## Types of Technical Interviews

Technical interviews can be daunting, especially for fresh graduates. Understanding the format is the first step to conquering them.

### 1. The Screening Round
Usually a phone or video call with a recruiter or junior engineer. They will ask basic questions about your background, projects, and potentially a simple coding problem.
**Goal:** Verify you are who you say you are and have basic competency.

### 2. The Coding Assessment (OA)
An online test on platforms like HackerRank or CodeSignal. You'll be given 1-3 algorithmic problems to solve within a time limit.
**Tip:** Practice speed and accuracy on LeetCode. Focus on Arrays, Strings, and HashMaps.

### 3. The On-Site / Virtual On-Site
This is the main event. It typically consists of 3-5 rounds spanning a full day.
*   **Coding Rounds:** Whiteboard style problems (e.g., "Invert a Binary Tree").
*   **System Design:** Designing scalable systems (e.g., "Design Twitter").
*   **Behavioral:** Assessing culture fit (e.g., "Tell me about a time you failed").

## Essential Topics to Master

To ace these rounds, you need a solid grasp of Computer Science fundamentals:
*   **Data Structures:** Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Hash Tables, Heaps.
*   **Algorithms:** Sorting, Searching (Binary Search), Recursion, Dynamic Programming, BFS/DFS.
*   **Big O Notation:** analyzing time and space complexity is crucial.

## The STAR Method for Behavioral Questions
Don't neglect the soft skills. Use the **STAR** technique to structure your answers:
*   **S**ituation: Set the scene.
*   **T**ask: Describe your responsibility.
*   **A**ction: Explain exactly what steps you took.
*   **R**esult: Share the outcome (quantify if possible).

## Practice Makes Perfect
The best way to prepare is through mock interviews.
*   **Peer Mocks:** Practice with friends.
*   **AI Mock Interviews:** Use **PlaceNxt's AI Interviewer** to simulate real scenarios, get instant feedback on your code and communication, and track your progress.

**Start practicing daily and you'll walk into that interview room with confidence!**
        `
    },
    {
        id: 3,
        slug: "ultimate-guide-to-campus-placements-2026",
        title: "The Ultimate Guide to Campus Placements in 2026",
        excerpt: "Campus placement season is approaching fast. Are you ready? Discover the complete roadmap to navigating on-campus recruitment drives, from aptitude tests to HR interviews, and securing the best offer.",
        category: "Career Guide",
        readTime: "6 min read",
        date: "Jan 28, 2026",
        image: "/blog/campus-placement.jpg",
        featured: false,
        keywords: ["campus placement", "recruitment drive", "job offer", "freshers", "aptitude test", "group discussion", "campus hiring", "college placement"],
        content: `
## The Campus Placement Process Demystified

For final-year students, placements are the most crucial phase of college life. Here is what the typical funnel looks like and how to clear each stage.

### Phase 1: Aptitude & Technical Tests
Most companies use this as an elimination round.
*   **Quantitative Aptitude:** Time & Work, Profit & Loss, Probability.
*   **Logical Reasoning:** Data Interpretation, Patterns, Blood Relations.
*   **Technical MCQ:** Core CS concepts (OS, DBMS, CN, OOPs).
**Strategy:** Speed is key. Practice mock tests daily for 1 month prior.

### Phase 2: Group Discussion (GD)
Used to test communication, leadership, and teamwork.
**Do's:**
*   Initiate if you have a strong point.
*   Listen to others and build on their points.
*   Maintain eye contact and positive body language.
**Don'ts:**
*   Don't be aggressive or interrupt constantly.
*   Don't stray from the topic.

### Phase 3: Technical Interview
Deep dive into your resume, projects, and technical skills.
*   **Projects:** Know your projects inside out. Be ready to explain the architecture and challenges faced.
*   **Internships:** Discuss what you learned and contributed.
*   **Basics:** Be thorough with your core engineering subjects.

### Phase 4: HR Interview
The final hurdle. Does your personality fit the company culture?
*   "Tell me about yourself." (Prepare a solid 1-minute pitch)
*   "Where do you see yourself in 5 years?"
*   "Why should we hire you?"

## How PlaceNxt Can Help
**PlaceNxt** is designed specifically for students facing placements.
1.  **Resume Build:** Create an ATS-friendly resume that highlights your student achievements.
2.  **Skill Badges:** Verify your skills with our tests and showcase badges on your profile.
3.  **Company Insights:** (Coming Soon) Get specific preparation tips for visiting companies.

**Preparation is the key to success. Good luck!**
        `
    },
    {
        id: 4,
        slug: "why-soft-skills-matter-more-than-you-think",
        title: "Why Soft Skills Matter More Than You Think",
        excerpt: "Technical skills might get you the interview, but soft skills get you the job. Explore why employers value communication, adaptability, and teamwork in 2026 and how you can demonstrate them.",
        category: "Soft Skills",
        readTime: "4 min read",
        date: "Jan 20, 2026",
        image: "/blog/soft-skills.jpg",
        featured: false,
        keywords: ["soft skills", "communication skills", "emotional intelligence", "teamwork", "leadership", "adaptability", "career growth", "workplace success"],
        content: `
## The Hard Truth About Soft Skills

Many candidates assume that being a top-tier coder or data analyst is enough. It isn't. In a modern collaborative workplace, **how** you work is just as important as the work you produce.

### Top Soft Skills Demand in 2026

#### 1. Communication
Can you explain complex technical concepts to non-technical stakeholders? Can you write clear documentation and emails?
*   **Tip:** Practice explaining your projects to a friend from a non-tech background.

#### 2. Adaptability
Technology changes fast. Employers want people who can learn new tools quickly and pivot when priorities change.
*   **Tip:** Highlight examples where you learned a new skill on the fly to solve a problem.

#### 3. Emotional Intelligence (EQ)
Understanding your own emotions and empathy for others is vital for teamwork and leadership.
*   **Tip:** Show how you resolved conflicts or supported team members in your behavioral interview answers.

#### 4. Time Management
Can you prioritize tasks and meet deadlines without burnout?
*   **Tip:** Discuss tools you use (Trello, Jira) and your personal productivity systems.

## Demonstrating Soft Skills in an Interview
You can't just say "I have good communication skills." You need to demonstrate them.
*   **Active Listening:** Listen carefully to the interviewer's question before answering.
*   **Clarity:** Speak slowly and structure your thoughts.
*   **Body Language:** Smile, nod, and maintain engagement.

**PlaceNxt's AI Interviewer** analyzes not just your answers, but your tone, pacing, and clarity, giving you feedback on your communication style specifically.
        `
    },
    {
        id: 5,
        slug: "optimizing-linkedin-profile-for-recruiters",
        title: "Optimizing Your LinkedIn Profile for Recruiters",
        excerpt: "Turn your LinkedIn profile into a magnet for recruiters. From writing a compelling headline to showcasing your skills effectively, discover simple hacks to boost your profile visibility.",
        category: "Networking",
        readTime: "5 min read",
        date: "Jan 15, 2026",
        image: "/blog/linkedin-opt.jpg",
        featured: false,
        keywords: ["LinkedIn optimization", "personal branding", "networking", "recruiters", "job search", "LinkedIn profile", "professional network", "career opportunities"],
        content: `
## Is Your LinkedIn Working for You?

90% of recruiters use LinkedIn to find candidates. If your profile is dormant, you're missing out on hidden opportunities.

### The 7-Step Optimization Checklist

1.  **Professional Headshot:** High quality, good lighting, professional attire. Profiles with photos get 21x more views.
2.  **Compelling Headline:** Don't just put "Student at XYZ College". Use keywords.
    *   *Bad:* "Student"
    *   *Good:* "CS Undergrad | Full Stack Developer | Python & React Enthusiast | Seeking Internship"
3.  **Engaging About Section:** Tell your story. Who are you? What drives you? What problems can you solve? Keep it conversational.
4.  **Experience & Projects:** Treat this like your resume. detailed achievements, links to GitHub repos or live demos.
5.  **Skills & Endorsements:** Add at least 5 relevant skills. Ask peers/professors to endorse you.
6.  **Recommendations:** Social proof is powerful. Request recommendations from internship mentors or project guides.
7.  **Activity:** Engage! Comment on industry posts, share your learning journey, write articles.

## The Power of Networking
Don't just connect; build relationships.
*   Send personalized connection requests. "Hi [Name], I loved your post about X..."
*   Reach out to alumni from your college working in your target companies. They are often willing to refer you.

**Your personal brand is your reputation. Build it wisely.**
        `
    },
    {
        id: 6,
        slug: "mock-interviews-secret-weapon-for-success",
        title: "Mock Interviews: The Secret Weapon for Success",
        excerpt: "Why practice alone when you can simulate the real thing? Learn how mock interviews can dramatically reduce anxiety, identify your blind spots, and improve your actual interview performance.",
        category: "Interview Prep",
        readTime: "4 min read",
        date: "Jan 10, 2026",
        image: "/blog/mock-interviews.jpg",
        featured: false,
        keywords: ["mock interview", "interview practice", "interview anxiety", "preparation", "feedback", "AI interview", "career success", "confidence building"],
        content: `
## Why You Fail Interviews (It's Not Lack of Skill)

Often, candidates fail not because they don't know the answer, but because they freeze up, ramble, or fail to communicate their thought process clearly. The antidote to anxiety is familiarity.

### Benefits of Mock Interviews

1.  **Reduce Anxiety:** By simulating the pressure environment, you desensitize yourself to the stress.
2.  **Identify Weaknesses:** You might think you know "Binary Search", but explaining it out loud reveals gaps in your understanding.
3.  **Improve Communication:** Practice articulating your thoughts while coding.
4.  **Time Management:** Learn to pace yourself to solve problems within the 30-45 minute window.

### Traditional Mocks vs. AI Mocks
*   **Peer Mocks:** Great for interaction, but feedback can be biased or limited by your peer's knowledge.
*   **Paid Expert Mocks:** innovative and high quality, but expensive ($100+ per session).
*   **AI Mock Interviews (PlaceNxt):**
    *   **Unlimited Practice:** Run as many sessions as you need.
    *   **Instant Feedback:** precise analysis of your code efficiency, speech clarity, and body language.
    *   **Cost-Effective:** Included in your PlaceNxt subscription (free tier available!).

## How to Conduct an Effective Mock
1.  Treat it like the real thing. Dress up, sit at a desk, remove distractions.
2.  Record yourself. Watching the replay is painful but incredibly educational.
3.  Focus on the *process*, not just the *answer*.

**Don't practice until you get it right. Practice until you can't get it wrong.**
        `
    }
];
