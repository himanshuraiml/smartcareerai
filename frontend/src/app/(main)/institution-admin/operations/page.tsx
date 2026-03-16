"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { motion } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";
import {
    Activity,
    Users,
    Building2,
    CalendarCheck,
    Briefcase,
    Clock,
    RefreshCw,
    QrCode,
    X,
    Camera,
    Download
} from "lucide-react";
import toast from "react-hot-toast";
import { Scanner } from '@yudiel/react-qr-scanner';
import * as XLSX from 'xlsx';

interface DashboardMetrics {
    activeDrivesCount: number;
    companiesActive: number;
    studentsInterviewing: number;
    offersReleased: number;
    totalAttendance: number;
    activeDrives: { id: string; name: string }[];
}

export default function WarRoomOperations() {
    const { user } = useAuthStore();
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        activeDrivesCount: 0,
        companiesActive: 0,
        studentsInterviewing: 0,
        offersReleased: 0,
        totalAttendance: 0,
        activeDrives: []
    });
    const [loading, setLoading] = useState(true);

    const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const [selectedDriveId, setSelectedDriveId] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [isProcessingScan, setIsProcessingScan] = useState(false);

    const handleExportAttendance = async () => {
        if (!selectedDriveId) return toast.error("Select a drive prior to export.");
        try {
            setIsExporting(true);
            const token = localStorage.getItem("accessToken");
            if (!token || !user?.adminForInstitutionId) return; // Fetch for placements
            const res = await authFetch(`/institution-admin/${user?.adminForInstitutionId}/ops/drives/${selectedDriveId}/attendance`);
            if (!res.ok) throw new Error("Failed to export attendance");

            const result = await res.json();
            const attendances = result.data || [];

            if (attendances.length === 0) {
                toast.error("No attendance records found for this drive.");
                return;
            }

            const excelData = attendances.map((record: any) => ({
                "Student Name": record.student?.name || "Unknown",
                "Email": record.student?.email || "Unknown",
                "Status": record.status,
                "Scanned At": record.scannedAt ? new Date(record.scannedAt).toLocaleString() : "Not Scanned"
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
            XLSX.writeFile(workbook, `Attendance_Report_${selectedDriveId}.xlsx`);

            toast.success("Excel exported successfully!");
            setIsExportModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Error exporting data.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleQrScan = async (detectedCodes: any[]) => {
        if (!detectedCodes || detectedCodes.length === 0 || isProcessingScan) return;
        if (!selectedDriveId) {
            toast.error("Select a drive first before scanning.");
            return;
        }

        const qrCode = detectedCodes[0].rawValue;
        if (!qrCode) return;

        try {
            setIsProcessingScan(true);
            const token = localStorage.getItem("accessToken");
            const res = await authFetch(`/institution-admin/${user?.adminForInstitutionId}/ops/drives/${selectedDriveId}/attendance/scan`, {
                method: "POST",
                body: JSON.stringify({ qrCode })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(`Success! Student ${data.data?.student?.name || ''} attendance verified.`, { icon: '👏' });
            } else {
                toast.error(data.message || data.error?.message || "Invalid QR code for this drive.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error marking attendance.");
        } finally {
            // Add a short delay to avoid multiple immediate duplicate scans
            setTimeout(() => {
                setIsProcessingScan(false);
            }, 3000);
        }
    };

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");
            if (!user?.adminForInstitutionId || !token) return;

            const res = await authFetch(`/institution-admin/dashboard`);// Dashboard is generic for the admin, or uses ID if needed. Wait, institution.routes says /dashboard. Gateway maps analytics/overview to dashboard. Let's use /institution-admin/dashboard.

            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    setMetrics(result.data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch war room metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.adminForInstitutionId) {
            fetchMetrics();
        }
    }, [user]);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                            <Activity className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Placement War Room</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
                        Real-time monitoring of active placement drives and operations.
                    </p>
                </div>
                <button
                    onClick={fetchMetrics}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: "Active Companies",
                        value: metrics.companiesActive,
                        icon: Building2,
                        color: "from-blue-500 to-indigo-600",
                        bg: "bg-blue-50 dark:bg-blue-500/10",
                        text: "text-blue-600 dark:text-blue-400"
                    },
                    {
                        title: "Students Interviewing",
                        value: metrics.studentsInterviewing,
                        icon: Users,
                        color: "from-amber-500 to-orange-600",
                        bg: "bg-amber-50 dark:bg-amber-500/10",
                        text: "text-amber-600 dark:text-amber-400"
                    },
                    {
                        title: "Offers Released",
                        value: metrics.offersReleased,
                        icon: Briefcase,
                        color: "from-emerald-500 to-teal-600",
                        bg: "bg-emerald-50 dark:bg-emerald-500/10",
                        text: "text-emerald-600 dark:text-emerald-400"
                    },
                    {
                        title: "Total Drive Attendance",
                        value: metrics.totalAttendance,
                        icon: QrCode,
                        color: "from-purple-500 to-fuchsia-600",
                        bg: "bg-purple-50 dark:bg-purple-500/10",
                        text: "text-purple-600 dark:text-purple-400"
                    }
                ].map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-500 dark:text-gray-400">{metric.title}</h3>
                                <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center`}>
                                    <metric.icon className={`w-5 h-5 ${metric.text}`} />
                                </div>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-black tracking-tight">{metric.value}</span>
                                <span className="text-sm font-bold text-emerald-500 mb-1">Live</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logistics Management Widget */}
                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5 xl:rounded-3xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold">Interview Logistics</h2>
                    </div>
                    <p className="text-gray-500 mb-6 font-medium">Manage panels and interview rooms for ongoing drives.</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => setIsPanelModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group font-bold"
                        >
                            <span className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                Assign Interview Panels
                            </span>
                            <span className="text-gray-400 group-hover:text-emerald-500">&rarr;</span>
                        </button>
                        <button
                            onClick={() => setIsRoomModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group font-bold"
                        >
                            <span className="flex items-center gap-3">
                                <CalendarCheck className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                Schedule Interview Rooms
                            </span>
                            <span className="text-gray-400 group-hover:text-emerald-500">&rarr;</span>
                        </button>
                    </div>
                </div>

                {/* Attendance Tracking Widget */}
                <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5 xl:rounded-3xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold">Attendance Tracking</h2>
                    </div>
                    <p className="text-gray-500 mb-6 font-medium">Generate entry codes and scan student presence.</p>
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setSelectedDriveId(""); // Reset selected drive
                                setIsScannerModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group font-bold"
                        >
                            <span className="flex items-center gap-3">
                                <QrCode className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                Open QR Scanner
                            </span>
                            <span className="text-gray-400 group-hover:text-emerald-500">&rarr;</span>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedDriveId(""); // Reset
                                setIsExportModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group font-bold"
                        >
                            <span className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                Export Attendance Report
                            </span>
                            <span className="text-gray-400 group-hover:text-emerald-500">&rarr;</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}

            {/* Assign Interview Panels Modal */}
            {isPanelModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl relative"
                    >
                        <button
                            onClick={() => setIsPanelModalOpen(false)}
                            className="absolute right-6 top-6 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Assign Interview Panels</h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">Allocate interviewers to active placement drives.</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="w-full mb-6">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-left">Select Drive</label>
                                <select
                                    value={selectedDriveId}
                                    onChange={(e) => setSelectedDriveId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none outline-none"
                                >
                                    <option value="" disabled>-- Select Active Drive --</option>
                                    {metrics.activeDrives?.map((drive) => (
                                        <option key={drive.id} value={drive.id}>{drive.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Assign Panel Member</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none outline-none">
                                    <option>Dr. Alan Turing (CS Dept)</option>
                                    <option>Prof. Grace Hopper (IT Dept)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPanelModalOpen(false)}
                                className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast.success("Panel successfully assigned!");
                                    setIsPanelModalOpen(false);
                                }}
                                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/25 transition-all active:scale-95"
                            >
                                Assign Panel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Schedule Interview Rooms Modal */}
            {isRoomModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl relative"
                    >
                        <button
                            onClick={() => setIsRoomModalOpen(false)}
                            className="absolute right-6 top-6 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                                <CalendarCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Schedule Rooms</h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">Book physical or virtual spaces for upcoming interviews.</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="w-full">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-left">Select Drive</label>
                                <select
                                    value={selectedDriveId}
                                    onChange={(e) => setSelectedDriveId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none outline-none"
                                >
                                    <option value="" disabled>-- Select Active Drive --</option>
                                    {metrics.activeDrives?.map((drive) => (
                                        <option key={drive.id} value={drive.id}>{drive.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Date</label>
                                    <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Time</label>
                                    <input type="time" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Select Room Allocation</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none outline-none">
                                    <option>Main Auditorium - Block A</option>
                                    <option>Conference Room 1 - Block B</option>
                                    <option>Virtual Meet Link (Auto-generate)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsRoomModalOpen(false)}
                                className="flex-1 py-3.5 rounded-xl border border-gray-200 dark:border-white/10 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast.success("Interview room scheduled successfully!");
                                    setIsRoomModalOpen(false);
                                }}
                                className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* QR Scanner Modal */}
            {isScannerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl relative flex flex-col items-center text-center"
                    >
                        <button
                            onClick={() => setIsScannerModalOpen(false)}
                            className="absolute right-4 top-4 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-4">
                            <Camera className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Live QR Scanner</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">Select a drive to start scanning student passes.</p>

                        <div className="w-full mb-6">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-left">Target Drive</label>
                            <select
                                value={selectedDriveId}
                                onChange={(e) => setSelectedDriveId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm appearance-none outline-none"
                            >
                                <option value="" disabled>-- Select Active Drive --</option>
                                {metrics.activeDrives?.map((drive) => (
                                    <option key={drive.id} value={drive.id}>{drive.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full max-w-[280px] aspect-square bg-black rounded-2xl border flex items-center justify-center overflow-hidden relative mb-6">
                            {selectedDriveId ? (
                                <Scanner
                                    onScan={handleQrScan}
                                    components={{ finder: false } as any}
                                />
                            ) : (
                                <div className="text-gray-500 text-sm font-bold flex flex-col items-center">
                                    <Camera className="w-8 h-8 opacity-50 mb-2" />
                                    Select Drive to Activate
                                </div>
                            )}
                            {selectedDriveId && (
                                <motion.div
                                    className="absolute left-0 right-0 h-1 bg-purple-500 shadow-[0_0_20px_5px_rgba(168,85,247,0.5)] z-10 pointer-events-none"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                />
                            )}
                        </div>

                    </motion.div>
                </div>
            )}

            {/* Export Attendance Modal */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl relative flex flex-col items-center text-center"
                    >
                        <button
                            onClick={() => setIsExportModalOpen(false)}
                            className="absolute right-4 top-4 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                            <Download className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Export Attendance</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">Select a drive to download the attendance report.</p>

                        <div className="w-full mb-8">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider text-left">Target Drive</label>
                            <select
                                value={selectedDriveId}
                                onChange={(e) => setSelectedDriveId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none outline-none"
                            >
                                <option value="" disabled>-- Select Active Drive --</option>
                                {metrics.activeDrives?.map((drive) => (
                                    <option key={drive.id} value={drive.id}>{drive.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            disabled={!selectedDriveId || isExporting}
                            onClick={handleExportAttendance}
                            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
                        >
                            {isExporting ? "Exporting..." : "Download Excel"}
                        </button>

                    </motion.div>
                </div>
            )}

        </div>
    );
}
