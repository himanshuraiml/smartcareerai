'use client';

import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-600 dark:text-gray-300 py-20 px-4 flex items-center justify-center">
            <div className="max-w-2xl w-full glass-premium p-10 rounded-3xl border-gradient relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Get in Touch</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-10">Have questions? We'd love to hear from you.</p>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Email Us</p>
                            <a href="mailto:support@placenxt.com" className="text-gray-900 dark:text-white font-semibold hover:text-indigo-400 transition-colors">support@placenxt.com</a>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Call Us</p>
                            <span className="text-gray-900 dark:text-white font-semibold">+91 12345 67890</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Locate Us</p>
                            <span className="text-gray-900 dark:text-white font-semibold">Bangalore, India</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


