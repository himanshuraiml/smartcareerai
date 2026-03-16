"use client";

import { useAuthStore } from "@/store/auth.store";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { ShieldCheck, Download, Camera } from "lucide-react";
import DashboardLayout from "../layout";

export default function QRPassPage() {
    const { user } = useAuthStore();

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin h-8 w-8 border-t-2 border-indigo-500 rounded-full" />
            </div>
        );
    }

    if (!user.institutionId || user.institutionId === "null") {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 text-center">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl">
                    <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Access Restricted</h1>
                    <p className="text-gray-500 mb-0 font-medium">
                        QR Pass is only available for students associated with a university or institution.
                    </p>
                </div>
            </div>
        );
    }


    const downloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "My_QR_Pass.png";
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="max-w-xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col items-center"
            >
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">My QR Pass</h1>
                <p className="text-gray-500 mb-8 text-center font-medium">
                    Show this QR code to the university or institution admin to mark your attendance at the offline placement drive.
                </p>

                <div className="bg-white p-6 rounded-2xl shadow-inner border-4 border-gray-100 dark:border-gray-800 mb-8">
                    <QRCodeSVG
                        id="qr-code-svg"
                        value={user.id}
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"Q"}
                        includeMargin={false}
                    />
                </div>

                <div className="w-full flex gap-4">
                    <button
                        onClick={downloadQR}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Save Pass
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/25 transition-all active:scale-95"
                    >
                        <Camera className="w-4 h-4" /> Print Pass
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
