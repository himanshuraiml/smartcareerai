"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authFetch } from "@/lib/auth-fetch";
import { GraduationCap, Calendar, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface StudentDrive {
    id: string;
    name: string;
    description: string | null;
    status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
    startDate: string | null;
    endDate: string | null;
    _count: { attendances: number; jobs: number };
    isRegistered: boolean;
    registration: { status: string; qrCode: string } | null;
}

const STATUS_BADGES: Record<string, string> = {
    UPCOMING: "bg-blue-900/30 text-blue-400",
    ONGOING: "bg-green-900/30 text-green-400",
    COMPLETED: "bg-gray-700/30 text-gray-400",
    CANCELLED: "bg-red-900/30 text-red-400",
};

export default function StudentDrivesPage() {
    const { user } = useAuthStore();
    const [drives, setDrives] = useState<StudentDrive[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    useEffect(() => {
        if (!user) return;
        authFetch("/institution-admin/student/drives")
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.data) setDrives(d.data); })
            .finally(() => setLoading(false));
    }, [user]);

    const handleRegister = async (driveId: string) => {
        setRegistering(driveId);
        try {
            const res = await authFetch(`/institution-admin/drives/${driveId}/register`, { method: "POST" });
            if (res.ok) {
                setDrives(prev => prev.map(d => d.id === driveId ? { ...d, isRegistered: true } : d));
                setToast({ msg: "Successfully registered for the drive!", ok: true });
            } else {
                const data = await res.json();
                setToast({ msg: data.message || "Failed to register", ok: false });
            }
        } catch {
            setToast({ msg: "Failed to register", ok: false });
        } finally {
            setRegistering(null);
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
        </div>
    );

    if (!user?.institutionId || user?.institutionId === "null") {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 text-center">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl">
                    <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Access Restricted</h1>
                    <p className="text-gray-500 mb-0 font-medium">
                        Campus Drives are only available for students associated with a university or institution.
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${toast.ok ? "bg-green-900/90 text-green-200" : "bg-red-900/90 text-red-200"}`}>
                    {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <GraduationCap className="w-7 h-7 text-blue-500" />
                    Campus Placement Drives
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Register for upcoming placement drives at your institution
                </p>
            </div>

            {drives.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-dashed border-gray-200 rounded-2xl">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No drives available</p>
                    <p className="text-xs text-gray-400 mt-1">Your institution hasn't scheduled any placement drives yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drives.map(d => (
                        <div key={d.id} className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="font-bold text-gray-900 dark:text-white">{d.name}</h3>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGES[d.status]}`}>
                                    {d.status}
                                </span>
                            </div>

                            {d.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{d.description}</p>
                            )}

                            <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
                                {d.startDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(d.startDate).toLocaleDateString()}
                                        {d.endDate && ` – ${new Date(d.endDate).toLocaleDateString()}`}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {d._count.attendances} registered
                                </span>
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    {d._count.jobs} companies
                                </span>
                            </div>

                            {d.isRegistered ? (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                                    <CheckCircle className="w-4 h-4" />
                                    Registered
                                    {d.registration?.status === "SCANNED" && (
                                        <span className="text-xs text-gray-400 ml-1">· Attendance marked</span>
                                    )}
                                </div>
                            ) : d.status === "UPCOMING" || d.status === "ONGOING" ? (
                                <button
                                    onClick={() => handleRegister(d.id)}
                                    disabled={registering === d.id}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
                                >
                                    {registering === d.id ? "Registering..." : "Register for Drive"}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {d.status === "COMPLETED" ? "Drive completed" : "Drive cancelled"}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
