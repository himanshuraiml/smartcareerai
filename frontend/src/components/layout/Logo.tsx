'use client';

import { useTheme } from '@/providers/ThemeProvider';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    variant?: 'light' | 'dark' | 'auto';
}

export default function Logo({
    className = "",
    width = 160,
    height = 53,
    variant = 'auto'
}: LogoProps) {
    const { theme } = useTheme();

    // Determine effective theme
    const effectiveTheme = variant === 'auto' ? theme : variant;
    const isDark = effectiveTheme === 'dark';

    // In light theme, the footer has a dark background (indigo-600), 
    // so we might need to handle that if the Logo is used there.
    // However, the Navbar is usually what needs theme switching.
    // Let's make the colors props or use CSS variables if possible.

    // For now, let's use theme-based colors but also allow override via className 
    // for places like the Footer which might have a different background.
    const textFill = isDark ? "#f2f2f2" : "#0f172a";
    const textStroke = isDark ? "#cfcfcf" : "#1e293b";

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 900 300"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="orangeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff4a00" />
                    <stop offset="100%" stopColor="#ffb300" />
                </linearGradient>

                <linearGradient id="cyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1ec9c9" />
                    <stop offset="100%" stopColor="#00e5ff" />
                </linearGradient>
            </defs>

            {/* TEXT: Placen */}
            <text
                x="70"
                y="185"
                fontFamily="Poppins, Arial, sans-serif"
                fontSize="130"
                fill={textFill}
                stroke={textStroke}
                strokeWidth="3"
                className="transition-colors duration-300"
            >
                Placen
            </text>

            {/* ARROW GROUP */}
            <g transform="translate(-70,0)">
                {/* ORANGE SHAFT */}
                <polygon
                    points="500,230 590,125 620,170 470,245"
                    fill="url(#orangeGrad)"
                />

                {/* CYAN SHAFT */}
                <polygon
                    points="540,70 620,170 660,150 530,50"
                    fill="url(#cyanGrad)"
                />
            </g>

            {/* TEXT: t */}
            <text
                x="620"
                y="185"
                fontFamily="Poppins, Arial, sans-serif"
                fontSize="130"
                fill={textFill}
                stroke={textStroke}
                strokeWidth="3"
                className="transition-colors duration-300"
            >
                t
            </text>
        </svg>
    );
}
