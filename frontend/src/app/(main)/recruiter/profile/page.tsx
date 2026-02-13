"use client";

import { useState } from "react";
import { Save, Building, MapPin, Globe, Users } from "lucide-react";

export default function CompanyProfilePage() {
    const [saving, setSaving] = useState(false);

    // Mock initial data
    const [profile, setProfile] = useState({
        companyName: "Tech Hunters Inc.",
        website: "https://techhunters.io",
        location: "San Francisco, CA",
        size: "51-200",
        industry: "Technology",
        description: "We hunt for the best tech talent in the world."
    });

    const handleSave = () => {
        setSaving(true);
        // Simulate API call
        setTimeout(() => setSaving(false), 1000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Company Profile</h1>
                <p className="text-gray-400 mt-1">Manage your company information and branding</p>
            </div>

            <div className="glass rounded-xl p-6 lg:p-8 space-y-6">
                {/* Logo Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                    <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Building className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                            Upload Logo
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Recommended: 400x400px, PNG or JPG.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Company Name</label>
                        <div className="relative">
                            <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={profile.companyName}
                                onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Website</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="url"
                                value={profile.website}
                                onChange={e => setProfile({ ...profile, website: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={profile.location}
                                onChange={e => setProfile({ ...profile, location: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Company Size</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <select
                                value={profile.size}
                                onChange={e => setProfile({ ...profile, size: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 [&>option]:text-black"
                            >
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="500+">500+ employees</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">About Company</label>
                    <textarea
                        value={profile.description}
                        onChange={e => setProfile({ ...profile, description: e.target.value })}
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                </div>

                <div className="pt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}


