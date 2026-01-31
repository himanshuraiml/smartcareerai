"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Users,
    BarChart,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    Activity,
    Building,
    Mail,
    CreditCard,
    AlertTriangle
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
    { href: "/admin", icon: BarChart, label: "Analytics" },
    { href: "/admin/users", icon: Users, label: "User Management" },
    { href: "/admin/institutions", icon: Building, label: "Institutions" },
    { href: "/admin/emails", icon: Mail, label: "Email Management" },
    { href: "/admin/billing", icon: CreditCard, label: "Billing" },
    { href: "/admin/errors", icon: AlertTriangle, label: "Error Monitoring" },
    { href: "/admin/activity", icon: Activity, label: "System Activity" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, accessToken } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            router.push("/login");
            return;
        }

        if (user && user.role !== "ADMIN") {
            router.push("/dashboard");
            return;
        }

        setIsAuthorized(true);
    }, [accessToken, user, router]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 glass border-r border-white/5
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                                Admin Portal
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                                            ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-white border border-red-500/30"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"}
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Admin User info */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                <span className="text-white font-medium">A</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Administrator</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 lg:ml-0 overflow-y-auto h-screen">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 glass border-b border-white/5">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-500" />
                            <span className="font-bold text-white">Admin Portal</span>
                        </div>
                        <div className="w-6" />
                    </div>
                </header>

                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
