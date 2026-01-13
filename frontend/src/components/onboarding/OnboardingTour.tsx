"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

interface TourStep {
    target: string; // CSS selector
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
    {
        target: ".roadmap-section",
        title: "Your Career Roadmap 🗺️",
        content: "This is your personalized journey. Follow each stage sequentially for the best results, or skip ahead if you're confident!",
        position: "right",
    },
    {
        target: ".xp-badge-section",
        title: "Level Up System ⚡",
        content: "Earn XP by completing actions like uploading resumes, taking tests, and practicing interviews. Watch your level grow!",
        position: "bottom",
    },
    {
        target: ".quick-stats",
        title: "Track Your Progress 📊",
        content: "Quick glance at your key metrics. Click any card to dive deeper into that area.",
        position: "bottom",
    },
    {
        target: ".quick-actions",
        title: "Quick Actions 🚀",
        content: "Jump straight into the most common tasks from here. Start with uploading your resume!",
        position: "left",
    },
];

interface OnboardingContextType {
    startTour: () => void;
    hasSeenTour: boolean;
}

const OnboardingContext = createContext<OnboardingContextType>({
    startTour: () => { },
    hasSeenTour: true,
});

export const useOnboarding = () => useContext(OnboardingContext);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [showTour, setShowTour] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasSeenTour, setHasSeenTour] = useState(true);

    useEffect(() => {
        const seen = localStorage.getItem("smartcareer_tour_completed");
        if (!seen) {
            setHasSeenTour(false);
            // Auto-start tour after a short delay for first-time users
            const timer = setTimeout(() => setShowTour(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const startTour = () => {
        setCurrentStep(0);
        setShowTour(true);
    };

    const completeTour = () => {
        setShowTour(false);
        setHasSeenTour(true);
        localStorage.setItem("smartcareer_tour_completed", "true");
    };

    const nextStep = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = TOUR_STEPS[currentStep];

    return (
        <OnboardingContext.Provider value={{ startTour, hasSeenTour }}>
            {children}

            <AnimatePresence>
                {showTour && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 z-[100]"
                            onClick={completeTour}
                        />

                        {/* Tour Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
                        >
                            <div className="p-6 rounded-2xl glass-premium border border-purple-500/30 neon-purple">
                                {/* Close Button */}
                                <button
                                    onClick={completeTour}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Icon */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-gray-400 mb-6">{step.content}</p>

                                {/* Progress Dots */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {TOUR_STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? "bg-purple-500" : "bg-gray-600"
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Navigation */}
                                <div className="flex justify-between">
                                    <button
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                        className="flex items-center gap-1 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        className="flex items-center gap-1 px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition"
                                    >
                                        {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </OnboardingContext.Provider>
    );
}
