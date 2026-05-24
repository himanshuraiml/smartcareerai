import Link from 'next/link';
import { Home, LayoutDashboard, Tag, ArrowRight } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#F8FAFC] dark:bg-[#080C16] text-gray-900 dark:text-white">
            {/* Ambient glow */}
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
                <div className="w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 text-center max-w-lg">
                {/* Big number */}
                <p className="text-[9rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-indigo-600 select-none">
                    404
                </p>

                <h1 className="text-2xl font-bold mt-2 mb-3">Page not found</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Home className="w-4 h-4" /> Back to Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                        href="/pricing"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                    >
                        <Tag className="w-4 h-4" /> Pricing
                    </Link>
                </div>

                <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 mt-8 text-sm text-blue-500 hover:underline"
                >
                    Report a broken link <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
