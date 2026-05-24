import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How PlaceNxt collects, uses, and protects your personal data.",
};

const SECTIONS = [
    {
        title: "1. Information We Collect",
        body: (
            <>
                <p>We collect information you provide directly when you create an account, update your profile, upload documents, or use our services. This may include:</p>
                <ul>
                    <li><strong>Identity data</strong> — name, email address, profile photo.</li>
                    <li><strong>Resume & career data</strong> — uploaded resume files, ATS scores, skill assessments, and mock-interview recordings.</li>
                    <li><strong>Usage data</strong> — pages visited, features used, session duration, and device / browser information collected automatically via cookies and analytics tools.</li>
                    <li><strong>Payment data</strong> — billing details processed and stored securely by our payment processor (Razorpay). We do not store full card numbers.</li>
                </ul>
            </>
        ),
    },
    {
        title: "2. How We Use Your Information",
        body: (
            <>
                <p>We use your data to provide, maintain, and improve PlaceNxt, including:</p>
                <ul>
                    <li>Generating AI-powered resume scores and improvement suggestions.</li>
                    <li>Conducting and analysing mock interviews and skill tests.</li>
                    <li>Matching you with relevant job opportunities and recruiters.</li>
                    <li>Sending transactional emails (account verification, password reset, interview reminders).</li>
                    <li>Personalising your dashboard, recommendations, and learning path.</li>
                    <li>Detecting and preventing fraud, abuse, and security incidents.</li>
                </ul>
                <p className="mt-3">We do <strong>not</strong> sell your personal data to third parties.</p>
            </>
        ),
    },
    {
        title: "3. Sharing Your Information",
        body: (
            <>
                <p>We share data only in the following circumstances:</p>
                <ul>
                    <li><strong>Recruiters & institutions</strong> — if you opt in to being discoverable, your profile (name, skills, scores) is visible to verified recruiters and partner institutions.</li>
                    <li><strong>Service providers</strong> — trusted vendors who process data on our behalf (cloud hosting, AI APIs, payment processing, email delivery). They are bound by data processing agreements.</li>
                    <li><strong>Legal requirements</strong> — if required by law, court order, or to protect the rights and safety of our users.</li>
                    <li><strong>Business transfers</strong> — in the event of a merger or acquisition, your data may be transferred to the successor entity.</li>
                </ul>
            </>
        ),
    },
    {
        title: "4. Cookies & Tracking",
        body: (
            <>
                <p>We use cookies and similar technologies for:</p>
                <ul>
                    <li><strong>Essential cookies</strong> — required for authentication and session management. Cannot be disabled.</li>
                    <li><strong>Analytics cookies</strong> — help us understand how users interact with the platform (e.g., page views, feature adoption). Only activated after you accept our cookie banner.</li>
                    <li><strong>Preference cookies</strong> — remember your theme choice (light/dark) and UI preferences.</li>
                </ul>
                <p className="mt-3">You can manage cookie preferences via the banner shown on your first visit, or by clearing your browser&apos;s local storage at any time.</p>
            </>
        ),
    },
    {
        title: "5. Data Retention",
        body: (
            <>
                <p>We retain your data for as long as your account is active. Specifically:</p>
                <ul>
                    <li><strong>Account data</strong> — kept until you request deletion.</li>
                    <li><strong>Resume files & interview recordings</strong> — retained for 2 years after your last activity, then permanently deleted.</li>
                    <li><strong>Transaction records</strong> — retained for 7 years to comply with financial regulations.</li>
                    <li><strong>Analytics data</strong> — retained in aggregated, anonymised form indefinitely.</li>
                </ul>
                <p className="mt-3">You may request early deletion of your data at any time (see Your Rights below).</p>
            </>
        ),
    },
    {
        title: "6. Your Rights (GDPR & DPDPA)",
        body: (
            <>
                <p>Depending on your location you may have the following rights regarding your personal data:</p>
                <ul>
                    <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
                    <li><strong>Correction</strong> — ask us to correct inaccurate or incomplete data.</li>
                    <li><strong>Erasure</strong> — request deletion of your account and associated data.</li>
                    <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
                    <li><strong>Objection</strong> — object to processing based on legitimate interests or for direct marketing.</li>
                    <li><strong>Restrict processing</strong> — ask us to pause processing while a dispute is resolved.</li>
                </ul>
                <p className="mt-3">To exercise any right, email us at <a href="mailto:privacy@placenxt.com" className="text-blue-500 hover:underline font-medium">privacy@placenxt.com</a>. We will respond within 30 days.</p>
            </>
        ),
    },
    {
        title: "7. Data Security",
        body: (
            <p>We implement industry-standard safeguards including TLS encryption in transit, AES-256 encryption at rest, role-based access controls, and regular security audits. Despite these measures, no system is completely secure. If you discover a vulnerability, please report it responsibly to <a href="mailto:security@placenxt.com" className="text-blue-500 hover:underline font-medium">security@placenxt.com</a>.</p>
        ),
    },
    {
        title: "8. Children's Privacy",
        body: (
            <p>PlaceNxt is intended for users aged 16 and above. We do not knowingly collect personal data from children under 16. If we become aware that a child has provided us personal data, we will delete it promptly.</p>
        ),
    },
    {
        title: "9. Changes to This Policy",
        body: (
            <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or an in-app banner at least 14 days before they take effect. Continued use of PlaceNxt after the effective date constitutes acceptance of the updated policy.</p>
        ),
    },
    {
        title: "10. Contact Us",
        body: (
            <>
                <p>For any privacy-related questions or to exercise your rights, contact our Data Protection team:</p>
                <ul>
                    <li>Email: <a href="mailto:privacy@placenxt.com" className="text-blue-500 hover:underline font-medium">privacy@placenxt.com</a></li>
                </ul>
            </>
        ),
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-600 dark:text-gray-300">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 mt-36 mb-24">
                {/* Header */}
                <div className="mb-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider mb-4">
                        Legal
                    </span>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Privacy Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Last updated: <time dateTime="2026-05-01">1 May 2026</time>
                    </p>
                    <p className="mt-4 text-base leading-relaxed">
                        PlaceNxt (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your personal data. This policy explains what we collect, why we collect it, and how you can control it.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {SECTIONS.map((section) => (
                        <section
                            key={section.title}
                            className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-6 md:p-8"
                        >
                            <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">
                                {section.title}
                            </h2>
                            <div className="prose-sm prose-gray dark:prose-invert max-w-none space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:leading-relaxed [&_p]:leading-relaxed">
                                {section.body}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}
