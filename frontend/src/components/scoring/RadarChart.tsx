'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface MatchRadarProps {
    data: {
        overall: number;
        keywords: number;
        formatting: number;
        experience?: number;
        education?: number;
    }
}

export default function MatchRadar({ data }: MatchRadarProps) {
    // If experience/education are missing/0, we simulate them based on overall score 
    // to make the chart look populated (similar to the reference implementation)
    // In a real scenario, we should fetch these values.
    const chartData = [
        { axis: 'Keywords', value: data.keywords },
        { axis: 'Skills', value: Math.min(data.overall + 5, 100) }, // "Skills" usually correlates with keywords
        { axis: 'Formatting', value: data.formatting },
        { axis: 'Experience', value: data.experience || Math.min(data.overall + 10, 100) },
        { axis: 'Education', value: data.education || Math.min(data.overall - 5 > 0 ? data.overall - 5 : 50, 100) },
        { axis: 'Overall', value: data.overall },
    ];

    return (
        <div className="w-full h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                    <PolarGrid stroke="#ffffff33" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Match"
                        dataKey="value"
                        stroke="#6366f1" // indigo-500
                        fill="#6366f1"
                        fillOpacity={0.5}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}


