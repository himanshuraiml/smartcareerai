'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Gem, TrendingUp, DollarSign, BarChart3, ArrowRight,
    CheckCircle2, Briefcase, Star, Lightbulb, Target
} from 'lucide-react';

const OFFER_TIPS = [
    {
        icon: DollarSign,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        title: 'Know Your Market Rate',
        desc: 'Research salary ranges on Glassdoor, Levels.fyi, and LinkedIn before any negotiation.',
    },
    {
        icon: Target,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        title: 'Evaluate the Full Package',
        desc: 'Compare base pay, equity, bonuses, benefits, PTO, and growth opportunities — not just salary.',
    },
    {
        icon: TrendingUp,
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        title: 'Never Accept the First Offer',
        desc: 'Most companies expect negotiation. A polite counter-offer rarely puts an offer at risk.',
    },
    {
        icon: Lightbulb,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        title: 'Use Competing Offers',
        desc: 'Multiple offers give you leverage. Let each company know you are evaluating other options.',
    },
];

const CHECKLIST = [
    'Compare base salary vs. industry median',
    'Check equity vesting schedule & cliff',
    'Review health, dental & vision coverage',
    'Understand annual bonus structure',
    'Confirm remote / hybrid policy',
    'Ask about learning & development budget',
    'Verify notice period & joining date',
];

export default function OfferHubPage() {
    return (
        <div className="space-y-8 min-h-screen">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-xl"
            >
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Gem className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-1">Stage 6</p>
                        <h1 className="text-3xl font-extrabold text-white">Offer Hub</h1>
                        <p className="text-purple-200 mt-1 text-sm max-w-xl">
                            Compare offers, understand your market worth, and negotiate confidently to land the best deal.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Tips */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        Negotiation Playbook
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {OFFER_TIPS.map((tip, i) => (
                            <motion.div
                                key={tip.title}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className={`w-10 h-10 rounded-xl ${tip.bg} flex items-center justify-center mb-3`}>
                                    <tip.icon className={`w-5 h-5 ${tip.color}`} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{tip.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tip.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Coming Soon Banner */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-2xl border border-dashed border-violet-400/40 bg-violet-500/5 text-center"
                    >
                        <Gem className="w-8 h-8 text-violet-400 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Offer Comparison Tool</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Side-by-side offer comparison with salary benchmarking is coming soon. Apply to jobs to unlock this stage.
                        </p>
                        <Link
                            href="/dashboard/jobs"
                            className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            Browse Jobs <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>

                {/* Right: Offer Evaluation Checklist */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Offer Evaluation Checklist</h3>
                        </div>
                        <ul className="space-y-3">
                            {CHECKLIST.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Link
                        href="/dashboard/applications"
                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">My Applications</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Track offer status</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
