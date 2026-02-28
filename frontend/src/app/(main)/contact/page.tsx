"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isLightMode, setIsLightMode] = useState(false);

    // Detect theme for dynamic styling
    useEffect(() => {
        const checkTheme = () => {
            const isLight = !document.documentElement.classList.contains('dark');
            setIsLightMode(isLight);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        inquiryType: "enterprise",
        message: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulating an API call
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setFormData({ name: "", email: "", company: "", inquiryType: "enterprise", message: "" });

            // Reset success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white py-20 px-4">
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Interested in our Enterprise plan, bulk licensing, or have a specific question? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <div
                            className="p-8 rounded-2xl transition-all h-full"
                            style={isLightMode ? {
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                            } : {
                                background: 'rgba(17, 24, 39, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(12px)'
                            }}
                        >
                            <h3 className="text-2xl font-bold mb-6" style={{ color: isLightMode ? '#0f172a' : '#ffffff' }}>Contact Information</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Email Us</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">support@placenxt.com</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">enterprise@placenxt.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Call Us</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">+1 (555) 123-4567</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Mon-Fri, 9am-6pm IST</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Office</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">123 Tech Park<br />Innovation Hub, IN 400001</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div
                            className="p-8 rounded-2xl transition-all"
                            style={isLightMode ? {
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                            } : {
                                background: 'rgba(17, 24, 39, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(12px)'
                            }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Work Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Company / Institution</label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="Your Company Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Inquiry Type</label>
                                        <select
                                            name="inquiryType"
                                            value={formData.inquiryType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        >
                                            <option value="enterprise">Enterprise Plan Request</option>
                                            <option value="education">Educational Institution Setup</option>
                                            <option value="support">General Support</option>
                                            <option value="other">Other Inquiry</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                {success && (
                                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        Message sent successfully! Our team will get back to you shortly.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
