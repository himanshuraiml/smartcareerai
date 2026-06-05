import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cookie Policy",
    description: "How PlaceNxt uses cookies and similar tracking technologies.",
};

const SECTIONS = [
    {
        title: "1. What Are Cookies",
        body: (
            <p>
                Cookies are small text files placed on your device when you visit a website. They allow the site to
                remember your actions and preferences over a period of time, so you don&apos;t have to keep re-entering
                them whenever you come back or browse between pages. Similar technologies — such as localStorage,
                sessionStorage, and pixel tags — work in comparable ways and are covered by this policy.
            </p>
        ),
    },
    {
        title: "2. Cookies We Use",
        body: (
            <>
                <p>PlaceNxt uses the following categories of cookies:</p>
                <ul>
                    <li>
                        <strong>Strictly necessary cookies</strong> — essential for the platform to function. They
                        enable core features like authentication, session management, and security. These cannot be
                        disabled without breaking the service.
                    </li>
                    <li>
                        <strong>Preference cookies</strong> — remember your settings such as theme (light/dark mode),
                        language, and UI layout choices so they persist across sessions.
                    </li>
                    <li>
                        <strong>Analytics cookies</strong> — help us understand how visitors interact with PlaceNxt by
                        collecting aggregated, anonymised data on page views, feature usage, session duration, and
                        navigation paths. These are only activated after you give consent via our cookie banner.
                    </li>
                    <li>
                        <strong>Performance cookies</strong> — monitor platform stability, load times, and error rates
                        so we can improve reliability and speed.
                    </li>
                </ul>
            </>
        ),
    },
    {
        title: "3. Third-Party Cookies",
        body: (
            <>
                <p>Some pages may include content or features served by third parties who may set their own cookies:</p>
                <ul>
                    <li>
                        <strong>Payment processing</strong> — Razorpay sets cookies to secure payment flows and prevent
                        fraud.
                    </li>
                    <li>
                        <strong>Authentication providers</strong> — Google OAuth sets cookies to manage social sign-in
                        sessions.
                    </li>
                    <li>
                        <strong>Analytics</strong> — we may use privacy-first analytics tools that set anonymised
                        identifiers. No personally identifiable information is sent to these services.
                    </li>
                </ul>
                <p className="mt-3">
                    We do not allow advertising networks to set cookies on PlaceNxt. We do not serve behavioural ads.
                </p>
            </>
        ),
    },
    {
        title: "4. Cookie Duration",
        body: (
            <>
                <p>Cookies on PlaceNxt fall into two duration categories:</p>
                <ul>
                    <li>
                        <strong>Session cookies</strong> — exist only for the duration of your browser session and are
                        deleted when you close your browser. Used for authentication tokens and CSRF protection.
                    </li>
                    <li>
                        <strong>Persistent cookies</strong> — remain on your device for a set period (typically 7–90
                        days) or until you delete them. Used for theme preferences and returning-user recognition.
                    </li>
                </ul>
            </>
        ),
    },
    {
        title: "5. Managing Your Cookie Preferences",
        body: (
            <>
                <p>You have several options to control cookies:</p>
                <ul>
                    <li>
                        <strong>Cookie banner</strong> — on your first visit, our consent banner lets you accept or
                        decline non-essential cookies. You can revisit this choice at any time via the &quot;Cookie
                        Settings&quot; link in the site footer.
                    </li>
                    <li>
                        <strong>Browser settings</strong> — most browsers allow you to block or delete cookies via
                        their settings. Refer to your browser&apos;s help documentation for instructions. Note that
                        blocking strictly necessary cookies will impair login functionality.
                    </li>
                    <li>
                        <strong>Clearing storage</strong> — you can clear cookies and localStorage at any time through
                        your browser&apos;s developer tools or privacy settings.
                    </li>
                </ul>
                <p className="mt-3">
                    Disabling analytics or preference cookies will not affect your ability to use PlaceNxt&apos;s core
                    features.
                </p>
            </>
        ),
    },
    {
        title: "6. Do Not Track",
        body: (
            <p>
                Some browsers transmit a &quot;Do Not Track&quot; (DNT) signal. PlaceNxt currently does not alter its
                data collection practices in response to DNT signals, as no industry-wide standard for honouring them
                exists. We instead rely on explicit cookie consent to govern non-essential tracking.
            </p>
        ),
    },
    {
        title: "7. Changes to This Policy",
        body: (
            <p>
                We may update this Cookie Policy to reflect changes in our practices or applicable law. We will notify
                you of material changes via an in-app banner or email at least 14 days before they take effect.
                Continued use of PlaceNxt after the effective date constitutes acceptance of the revised policy.
            </p>
        ),
    },
    {
        title: "8. Contact Us",
        body: (
            <>
                <p>For any questions about our use of cookies, please contact:</p>
                <ul>
                    <li>
                        Email:{" "}
                        <a href="mailto:privacy@placenxt.com" className="text-blue-500 hover:underline font-medium">
                            privacy@placenxt.com
                        </a>
                    </li>
                </ul>
            </>
        ),
    },
];

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-600 dark:text-gray-300">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 mt-36 mb-24">
                {/* Header */}
                <div className="mb-10">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-wider mb-4">
                        Legal
                    </span>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Cookie Policy</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Last updated: <time dateTime="2026-05-01">1 May 2026</time>
                    </p>
                    <p className="mt-4 text-base leading-relaxed">
                        This Cookie Policy explains what cookies are, how PlaceNxt (&quot;we&quot;, &quot;our&quot;,
                        &quot;us&quot;) uses them, and how you can control them. For broader privacy information, see
                        our{" "}
                        <a href="/privacy" className="text-blue-500 hover:underline font-medium">
                            Privacy Policy
                        </a>
                        .
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
