"use client";

import { useState } from "react";
import { Activity, User, Briefcase, FileText, CheckCircle, AlertCircle } from "lucide-react";

// Mock data for activity log
const MOCK_ACTIVITIES = [
    {
        id: 1,
        type: "USER_REGISTER",
        message: "New user registration: john.doe@example.com",
        user: "John Doe",
        time: "2 minutes ago",
        status: "success"
    },
    {
        id: 2,
        type: "JOB_POST",
        message: "New job posted: Senior React Developer",
        user: "Tech Hunters Inc.",
        time: "15 minutes ago",
        status: "success"
    },
    {
        id: 3,
        type: "SYSTEM_ALERT",
        message: "High API latency detected in Scoring Service",
        user: "System",
        time: "1 hour ago",
        status: "warning"
    },
    {
        id: 4,
        type: "USER_LOGIN",
        message: "Admin login detected",
        user: "System Administrator",
        time: "2 hours ago",
        status: "success"
    },
    {
        id: 5,
        type: "RESUME_ANALYSIS",
        message: "Resume analysis completed for specialized role",
        user: "Sarah Smith",
        time: "3 hours ago",
        status: "success"
    }
];

export default function ActivityPage() {
    const [filter, setFilter] = useState("ALL");

    const getIcon = (type: string) => {
        switch (type) {
            case "USER_REGISTER": return <User className="w-5 h-5 text-blue-400" />;
            case "JOB_POST": return <Briefcase className="w-5 h-5 text-purple-400" />;
            case "RESUME_ANALYSIS": return <FileText className="w-5 h-5 text-green-400" />;
            case "SYSTEM_ALERT": return <AlertCircle className="w-5 h-5 text-red-400" />;
            default: return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">System Activity</h1>
                <p className="text-gray-400 mt-1">Real-time log of system events and user actions</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['ALL', 'USER', 'SYSTEM', 'JOBS'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? "bg-white/10 text-white"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="glass rounded-xl p-6 space-y-8">
                {MOCK_ACTIVITIES.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-4">
                        {/* Connecting Line */}
                        {index !== MOCK_ACTIVITIES.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-[-32px] w-[2px] bg-white/5" />
                        )}

                        <div className="relative z-10 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            {getIcon(activity.type)}
                        </div>

                        <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-white font-medium">{activity.message}</h3>
                                <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">by {activity.user}</span>
                                {activity.status === 'success' ? (
                                    <span className="flex items-center gap-1 text-xs text-green-500/50 bg-green-500/10 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="w-3 h-3" /> Success
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs text-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                        <AlertCircle className="w-3 h-3" /> Warning
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
