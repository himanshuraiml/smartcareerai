'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, ArrowRight, TrendingUp, Quote } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useTheme } from '@/providers/ThemeProvider';

const STORIES = [
    {
        name: 'Aditya Verma',
        role: 'Software Engineer @ Google',
        college: 'BITS Pilani',
        avatar: 'AV',
        salaryIncrease: '3.2x',
        timeToOffer: '6 weeks',
        gradient: 'from-blue-500 to-cyan-500',
        quote: 'I had 3 previous rejections at top companies. PlaceNxt\'s AI mock interviews helped me identify exactly where I was going wrong. The feedback was brutally honest but spot-on. Got the Google offer on the next attempt.',
        tags: ['AI Mock Interviews', 'Resume ATS Score', 'Skills Gap Analysis'],
    },
    {
        name: 'Priya Menon',
        role: 'Product Manager @ Razorpay',
        college: 'IIM Kozhikode',
        avatar: 'PM',
        salaryIncrease: '2.8x',
        timeToOffer: '4 weeks',
        gradient: 'from-violet-500 to-purple-500',
        quote: 'The ATS score feature was eye-opening. My resume was scoring 42% before. After following PlaceNxt\'s AI recommendations, I got to 91% and started hearing back from companies I never would have heard from otherwise.',
        tags: ['ATS Resume Score', 'Job Matching', 'Interview Copilot'],
    },
    {
        name: 'Rohan Gupta',
        role: 'Data Scientist @ Flipkart',
        college: 'NIT Trichy',
        avatar: 'RG',
        salaryIncrease: '4.1x',
        timeToOffer: '8 weeks',
        gradient: 'from-emerald-500 to-teal-500',
        quote: 'Coming from a tier-2 college, I always felt at a disadvantage. PlaceNxt leveled the playing field. The skill badges I earned through their validation tests gave recruiters objective proof of my abilities.',
        tags: ['Skill Badges', 'Technical Assessments', 'Talent Pool'],
    },
    {
        name: 'Sneha Patil',
        role: 'Frontend Engineer @ Swiggy',
        college: 'VIT Vellore',
        avatar: 'SP',
        salaryIncrease: '2.5x',
        timeToOffer: '3 weeks',
        gradient: 'from-orange-500 to-amber-500',
        quote: 'The Future-Ready Lab tracks on React and system design were incredibly thorough. I went from knowing the basics to confidently talking about architecture trade-offs in interviews. Three offers in two weeks.',
        tags: ['Future-Ready Lab', 'AI Mock Interviews', 'Skill Badges'],
    },
    {
        name: 'Arjun Krishnan',
        role: 'Backend Engineer @ Zepto',
        college: 'PSG Tech Coimbatore',
        avatar: 'AK',
        salaryIncrease: '3.7x',
        timeToOffer: '5 weeks',
        gradient: 'from-pink-500 to-rose-500',
        quote: 'I used the Interview Copilot for my final round with Zepto. The real-time suggestions during the live interview were subtle but made a huge difference in how I structured my answers.',
        tags: ['Interview Copilot', 'AI Mock Interviews', 'Job Matching'],
    },
    {
        name: 'Meera Nair',
        role: 'ML Engineer @ PhonePe',
        college: 'DSCE Bangalore',
        avatar: 'MN',
        salaryIncrease: '5.2x',
        timeToOffer: '10 weeks',
        gradient: 'from-indigo-500 to-blue-500',
        quote: 'PlaceNxt matched me with PhonePe before they even posted the job publicly. Turns out they had me in their talent pool because of my AI/ML skill badges. First call from recruiter to offer in 10 weeks.',
        tags: ['Talent Pool', 'Skill Badges', 'AI Mock Interviews'],
    },
];

const STATS = [
    { value: '72%', label: 'Average placement rate increase for partner colleges' },
    { value: '3.4x', label: 'Average salary increase for PlaceNxt users' },
    { value: '6 weeks', label: 'Average time from signup to first offer' },
    { value: '94%', label: 'Users who recommend PlaceNxt to friends' },
];

export default function SuccessStoriesPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const cardStyle = isLight
        ? { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
        : { background: 'rgba(17,24,39,0.5)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-6">
                            <Star className="w-4 h-4" /> Real Students, Real Results
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                            Success Stories That<br />Speak for Themselves
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            From tier-2 colleges to top-10 companies. These are the students who used PlaceNxt to land their dream jobs.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Aggregate Stats */}
            <section className="pb-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {STATS.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-2xl p-5 text-center"
                                style={cardStyle}
                            >
                                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mb-1">{stat.value}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stories Grid */}
            <section className="py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STORIES.map((story, i) => (
                            <motion.div
                                key={story.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="rounded-2xl p-6 flex flex-col gap-4"
                                style={cardStyle}
                            >
                                {/* Header */}
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${story.gradient} flex items-center justify-center flex-shrink-0 text-white font-black shadow-md`}>
                                        {story.avatar}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{story.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{story.role}</p>
                                        <p className="text-xs text-gray-400">{story.college}</p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-center">
                                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{story.salaryIncrease}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">Salary Increase</div>
                                    </div>
                                    <div className="rounded-xl p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-center">
                                        <div className="text-lg font-black text-blue-600 dark:text-blue-400">{story.timeToOffer}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">Time to Offer</div>
                                    </div>
                                </div>

                                {/* Quote */}
                                <div className="relative">
                                    <Quote className="w-6 h-6 text-gray-200 dark:text-white/10 absolute -top-1 -left-1" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-4 italic">
                                        "{story.quote}"
                                    </p>
                                </div>

                                {/* Feature Tags */}
                                <div className="flex flex-wrap gap-1.5 mt-auto">
                                    {story.tags.map(tag => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <TrendingUp className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black mb-4">Your Story Starts Here</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Join 1M+ students already on the path to their dream career.</p>
                    <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity shadow-xl shadow-orange-500/25">
                        Start Your Free Journey <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}
