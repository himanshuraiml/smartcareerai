'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
    PenSquare, LayoutDashboard, Clock, BookOpen, LogOut, Menu,
} from 'lucide-react';

interface NavItem { href: string; label: string; icon: React.ElementType; exact?: boolean }

function SidebarContent({ navItems, user, pathname, onClose, onLogout }: {
    navItems: NavItem[];
    user: { name?: string | null; email?: string | null; role?: string };
    pathname: string;
    onClose: () => void;
    onLogout: () => void;
}) {
    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);
    return (
        <div className="flex flex-col h-full">
            <div className="p-5 border-b border-white/10">
                <Link href="/cms" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <PenSquare size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">Blog CMS</span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(item => (
                    <Link key={item.href} href={item.href} onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.href, item.exact)
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{user.name || 'Writer'}</p>
                        <p className="text-xs text-gray-400 truncate">{user.role}</p>
                    </div>
                </div>
                <button onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <LogOut size={14} />
                    Sign out
                </button>
            </div>
        </div>
    );
}

export default function CmsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login?redirect=/cms');
        } else if (user.role !== 'EDITOR' && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (!user || (user.role !== 'EDITOR' && user.role !== 'ADMIN')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isAdmin = user.role === 'ADMIN';

    const navItems = [
        { href: '/cms', label: 'My Posts', icon: LayoutDashboard, exact: true },
        { href: '/cms/new', label: 'New Post', icon: PenSquare },
        ...(isAdmin ? [
            { href: '/cms/admin/pending', label: 'Pending Review', icon: Clock },
            { href: '/cms/admin/posts', label: 'All Posts', icon: BookOpen },
        ] : []),
    ];

    const handleLogout = () => { logout(); router.push('/login'); };
    const sidebarProps = { navItems, user, pathname, onClose: () => setSidebarOpen(false), onLogout: handleLogout };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-56 flex-col bg-gray-900 shrink-0">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="relative w-56 bg-gray-900 flex flex-col">
                        <SidebarContent {...sidebarProps} />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/10">
                    <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                        <Menu size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <Link href="/cms" className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                            <PenSquare size={12} className="text-white" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">Blog CMS</span>
                    </Link>
                    <div className="w-8" />
                </header>

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
