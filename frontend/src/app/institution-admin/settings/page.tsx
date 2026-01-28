"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    Save,
    Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface InstitutionSettings {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
    address: string | null;
}

export default function InstitutionSettingsPage() {
    const { accessToken } = useAuthStore();
    const [settings, setSettings] = useState<InstitutionSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${API_URL}/admin/institution/settings`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch settings");
                }

                const result = await response.json();
                setSettings(result.data);
                setName(result.data.name || "");
                setLogoUrl(result.data.logoUrl || "");
                setAddress(result.data.address || "");
            } catch (err) {
                console.error("Error fetching settings:", err);
                setError("Failed to load institution settings");
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchSettings();
        }
    }, [accessToken]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`${API_URL}/admin/institution/settings`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, logoUrl, address }),
            });

            if (!response.ok) {
                throw new Error("Failed to save settings");
            }

            const result = await response.json();
            setSettings(result.data);
            setSuccess("Settings saved successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error("Error saving settings:", err);
            setError("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-white text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                Loading settings...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Institution Settings</h1>
                <p className="text-gray-400 mt-1">Manage your institution profile</p>
            </div>

            <form onSubmit={handleSave} className="p-6 rounded-xl glass border border-white/5 space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                            <Building2 className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">{settings?.name || "Your Institution"}</h2>
                        {settings?.domain && (
                            <p className="text-sm text-gray-400">Domain: {settings.domain}</p>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {success}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Institution Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="Enter institution name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Logo URL
                        </label>
                        <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="https://example.com/logo.svg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Provide a URL to your institution&apos;s logo</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Address
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                            placeholder="123 Campus Drive, City, Country"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
