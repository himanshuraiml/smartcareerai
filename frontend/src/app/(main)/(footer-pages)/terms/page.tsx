export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-600 dark:text-gray-300 py-20 px-4">
            <div className="max-w-4xl mx-auto space-y-8 glass-card p-10 rounded-2xl">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>

                <section>
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-3">1. Acceptance of Terms</h2>
                    <p>By accessing or using PlaceNxt, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-3">2. Use of Services</h2>
                    <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account credentials.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-3">3. AI Content Disclaimer</h2>
                    <p>Our services use Artificial Intelligence to provide feedback and suggestions. While we strive for accuracy, AI-generated content may not always be 100% correct. Users should use their judgment when acting on this advice.</p>
                </section>

                <p className="text-sm text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}


