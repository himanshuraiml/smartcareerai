export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0B0F19] text-gray-300 py-20 px-4">
            <div className="max-w-4xl mx-auto space-y-8 glass-card p-10 rounded-2xl">
                <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>

                <section>
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-3">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, update your profile, or use our services. This may include your name, email address, resume data, and interview recordings.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-3">2. How We Use Your Information</h2>
                    <p>We use your information to provide, maintain, and improve our services, including:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Generating AI-powered resume scores and suggestions.</li>
                        <li>Conducting and analyzing mock interviews.</li>
                        <li>Matching you with relevant job opportunities.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-indigo-400 mb-3">3. Data Security</h2>
                    <p>We implement industry-standard security measures to protect your personal information. Your data is encrypted in transit and at rest.</p>
                </section>

                <p className="text-sm text-gray-500 mt-8">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
}


