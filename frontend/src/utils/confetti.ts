"use client";

import confetti, { Options } from "canvas-confetti";

export const triggerConfetti = () => {
    const count = 200;
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
    };

    function fire(particleRatio: number, opts: Options) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ["#8B5CF6", "#EC4899", "#10B981"],
    });

    fire(0.2, {
        spread: 60,
        colors: ["#8B5CF6", "#EC4899", "#10B981"],
    });

    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ["#8B5CF6", "#EC4899", "#10B981"],
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: ["#8B5CF6", "#EC4899", "#10B981"],
    });

    fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: ["#8B5CF6", "#EC4899", "#10B981"],
    });
};

export const triggerBadgeUnlock = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ["#F59E0B", "#EAB308", "#FCD34D"];

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
            zIndex: 9999,
        });
        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
            zIndex: 9999,
        });

        if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
        }
    })();
};

export const triggerStageComplete = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#34D399", "#6EE7B7"],
        zIndex: 9999,
    });
};
